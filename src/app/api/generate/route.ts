// src/app/api/generate/route.ts
// Fast path — never waits for rendering. Returns jobId in <2s.

export const maxDuration = 300

import { fastEstimateCost, estimateRenderSeconds } from '@/lib/orchestration/fastEstimate'
import { calculateSimpleCost }                     from '@/lib/credits'
import { checkAccess, deductUserCredits }          from '@/lib/access/guard'
import { MODEL_COUNCIL_DISPLAY, MODEL_COSTS, TIER_ENGINE_MAP } from '@/lib/routing/engineRegistry'
import { after }                                   from 'next/server'
import { db }                                      from '@/lib/db'

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    prompt?:           string
    script?:           string
    duration?:         number
    selectedModels?:   string[]
    mode?:             string
    generationMode?:   string
    source?:           string
    tier?:             string
    projectId?:        string
    characterId?:      string
    musicUrl?:         string
    ambienceUrl?:      string
  }

  const rawPrompt = (body.prompt ?? body.script)?.trim()
  let duration       = body.duration ?? 10
  const requestedModels = body.selectedModels
  const mode           = body.mode ?? 'simple'
  const generationMode = (body.generationMode === 'production' ? 'production' : 'draft') as 'draft' | 'production'
  const source         = body.source ?? (mode === 'director' ? 'director' : 'simple')
  const tier           = body.tier ?? 'standard'
  const { projectId, characterId, musicUrl, ambienceUrl } = body

  if (!rawPrompt || rawPrompt.length < 10) {
    return Response.json(
      { error: 'Script is required — send current editor content as "prompt"' },
      { status: 400 },
    )
  }

  const validModelIds = new Set([
    ...MODEL_COUNCIL_DISPLAY.map((m) => m.id),
    ...Object.keys(MODEL_COSTS),
  ])
  let selectedModels = (requestedModels ?? []).filter((id) => validModelIds.has(id))

  if (mode === 'director' && requestedModels?.length && selectedModels.length === 0) {
    return Response.json({
      error: 'No valid models in council selection — refresh and re-select models',
    }, { status: 400 })
  }

  if (mode === 'director' && selectedModels.length === 0) {
    return Response.json({
      error: 'Select at least one model in the council before generating',
    }, { status: 400 })
  }

  const { enrichGeneratePayload } = await import('@/lib/character/jobIdentity')
  const enriched = await enrichGeneratePayload(userId, projectId, {
    prompt: rawPrompt,
    characterId,
  })
  const prompt = typeof enriched.prompt === 'string' ? enriched.prompt : rawPrompt
  const fccCognitionContext = enriched.fccCognitionContext as
    | { name: string; behavioralPrompt: string; wardrobeSummary: string; appearanceSummary: string }
    | undefined

  let creditCost = mode === 'director'
    ? fastEstimateCost(selectedModels, duration)
    : calculateSimpleCost(tier, duration)

  if (creditCost === 0) {
    creditCost = Math.max(5, Math.ceil((duration / 5) * 6))
  }

  const access = await checkAccess(
    userId,
    creditCost,
    mode === 'director' ? 'directorMode' : undefined,
  )
  if (!access.allowed) {
    const status = access.code ?? 402
    return Response.json({
      error:           access.reason ?? 'Access denied',
      code:            status === 403 ? 'TIER_RESTRICTED' : undefined,
      upgradeRequired: status === 403,
    }, { status })
  }

  const etaSeconds = estimateRenderSeconds(selectedModels, duration)
  const engine     = TIER_ENGINE_MAP[tier] ?? 'ltx-2.3-fast'

  const job = await db.renderJob.create({
    data: {
      userId,
      projectId: projectId ?? undefined,
      prompt,
      duration,
      mode,
      status:        'QUEUED',
      progressPct:   0,
      statusMessage: mode === 'director' ? 'Queued — starting director orchestration…' : 'Queued — waiting for an available worker',
      etaSeconds,
      creditsCharged: creditCost,
      metadata: {
        selectedModels,
        generationMode,
        source,
        tier,
        engine,
        estimatedCredits: creditCost,
        projectId,
        characterId,
        fccCognitionContext,
        characterRefs: Array.isArray(enriched.characterRefs) ? enriched.characterRefs : undefined,
        loraId: typeof enriched.loraId === 'string' ? enriched.loraId : undefined,
        musicUrl: typeof musicUrl === 'string' ? musicUrl : undefined,
        ambienceUrl: typeof ambienceUrl === 'string' ? ambienceUrl : undefined,
      },
    },
  })

  if (projectId && (musicUrl || ambienceUrl)) {
    await db.project.update({
      where: { id: projectId },
      data: {
        ...(typeof musicUrl === 'string' ? { musicUrl } : {}),
        ...(typeof ambienceUrl === 'string' ? { ambienceUrl } : {}),
      },
    }).catch(() => {})
  }

  const queuePayload = {
    jobId: job.id,
    userId,
    prompt,
    duration,
    selectedModels,
    generationMode,
    source,
    tier,
    engine,
    creditCost,
    useCognition: mode === 'director',
    fccCognitionContext,
    projectId,
  }

  if (process.env.VERCEL) {
    after(async () => {
      try {
        if (mode === 'director') {
          const { processOrchestrateJobWithRefund } = await import('@/lib/jobs/processOrchestrateJob')
          await processOrchestrateJobWithRefund({ ...queuePayload, creditCost })
        } else {
          const { processRenderSimpleJob } = await import('@/lib/jobs/processOrchestrateJob')
          await processRenderSimpleJob({
            jobId: job.id,
            userId,
            prompt,
            duration,
            engine,
          })
        }
      } catch (err) {
        console.error('[generate] inline job failed:', err instanceof Error ? err.message : err)
      }
    })
  } else {
    try {
      const { renderQueue } = await import('@/lib/queue')
      await renderQueue.add(
        mode === 'director' ? 'orchestrate' : 'render-simple',
        queuePayload,
        mode === 'director'
          ? {
              attempts: 2,
              backoff: { type: 'fixed', delay: 5_000 },
              removeOnComplete: 200,
              removeOnFail: 500,
            }
          : { attempts: 1, removeOnComplete: 200, removeOnFail: 500 },
      )
    } catch {
      await db.renderJob.update({
        where: { id: job.id },
        data:  { status: 'FAILED', errorMessage: 'Queue unavailable — check REDIS_URL' },
      })
      return Response.json({ error: 'Render queue unavailable. Try again shortly.' }, { status: 503 })
    }
  }

  if (mode !== 'director') {
    await deductUserCredits(userId, creditCost, `${mode}: ${prompt.slice(0, 40)}`, 'fal')
  }

  return Response.json({
    jobId:            job.id,
    queued:           true,
    estimatedCredits: creditCost,
    etaSeconds,
    selectedModels:   mode === 'director' ? selectedModels : undefined,
  })
}
