import { NextRequest, NextResponse, after } from 'next/server'

export const maxDuration = 300
import { z } from 'zod'
import { auth } from '@/lib/auth'
import { nanoid } from 'nanoid'
import { db } from '@/lib/db'
import { renderQueue, getPriorityForRole } from '@/lib/queue'
import { checkAndDeductCredits, refundCredits, OPERATION_COSTS } from '@/lib/credits'
import { routeToModel, getOperationCostKey, normalizeWorkerModelId, normaliseModelId } from '@/lib/models/router'
import { decomposeClip } from '@/lib/routing/SceneDecomposer'
import { dispatchClip } from '@/lib/routing/MediaDispatcher'
import { blendMultiEngineClip } from '@/lib/routing/SeamlessBlender'
import type { QualityTier, SceneType } from '@/lib/models/types'
import { enrichGeneratePayload } from '@/lib/character/jobIdentity'

const createJobSchema = z.object({
  projectId: z.string().optional(),
  type: z.enum([
    'GENERATE',
    'REPAINT',
    'RELIGHT',
    'UPSCALE',
    'EXPORT',
    'LORA_TRAIN',
    'LIPSYNC',
    'AUTO_SOCIAL',
    'TRANSCRIBE',
    'CGI_INSERT',
  ]),
  quality: z
    .enum(['draft', 'standard', 'premium', 'cinematic', 'film'])
    .optional()
    .default('standard'),
  sceneType: z
    .enum(['action', 'dialogue', 'environment', 'aerial', 'cgi_heavy', 'general'])
    .optional(),
  payload: z.record(z.string(), z.unknown()),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  const userId = request.headers.get('x-user-id') ?? session?.user?.id
  const userRole = request.headers.get('x-user-role') ?? (session?.user as { role?: string } | undefined)?.role ?? 'FREE'

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const parsed = createJobSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  let { projectId, type, quality, sceneType, payload } = parsed.data

  if (type === 'GENERATE') {
    const rawPrompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : ''
    if (!rawPrompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
    payload = { ...payload, prompt: rawPrompt }
    payload = await enrichGeneratePayload(userId, projectId, payload)
    if (typeof payload.prompt !== 'string' || !payload.prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
    }
  }

  // ── Multi-engine omnichannel path for GENERATE jobs ──────────────────────
  if (type === 'GENERATE') {
    const p = payload as {
      prompt?: string
      duration?: number
      characterIds?: string[]
      locationId?: string
      forceMultiEngine?: boolean
      loraId?: string
      characterRefs?: string[]
    }

    const prompt = (p.prompt ?? '') as string
    const duration = Number(p.duration ?? 5)
    const tierLabel = ({ draft: 'Draft', standard: 'Standard', premium: 'Standard', cinematic: 'Cinematic', film: 'Film' }[quality] ?? 'Standard')

    // Decompose into segments — Model 1 decides if multi-engine is warranted
    let segments
    try {
      segments = await decomposeClip({
        masterPrompt: prompt,
        clipId: nanoid(8),
        duration,
        tier: tierLabel,
        characterIds: p.characterIds,
        locationId: p.locationId,
        forceMultiEngine: p.forceMultiEngine,
      })
    } catch {
      // Decomposition failure — fall through to single-engine path
      segments = null
    }

    if (segments && segments.length > 1) {
      // Multi-engine path: deduct credits per segment
      const totalCost = segments.reduce((s, seg) => s + seg.estimatedCredits, 0)

      try {
        // Deduct aggregate cost as a single logical operation
        await checkAndDeductCredits(userId, 'generate_wan', Math.ceil(totalCost / (OPERATION_COSTS['generate_wan'] ?? 2)))
      } catch (err) {
        return NextResponse.json({ error: (err as Error).message }, { status: 402 })
      }

      const jobId = nanoid()
      const renderJob = await db.renderJob.create({
        data: {
          id: jobId,
          userId,
          projectId,
          type: 'GENERATE' as never,
          status: 'PROCESSING',
          modelUsed: 'multi_engine',
          creditsCharged: totalCost,
          inputPayload: payload as never,
          priority: getPriorityForRole(userRole),
        },
      })

      const runMultiEngine = async () => {
        try {
          const results = await dispatchClip({ segments })
          const { blendedUrl } = await blendMultiEngineClip({
            segments: results.map((r) => ({
              segmentId: r.segmentId,
              videoUrl: r.videoUrl,
              engineId: segments!.find((s) => s.segmentId === r.segmentId)?.engineId ?? 'wan',
            })),
          })

          await db.renderJob.update({
            where: { id: jobId },
            data: { status: 'COMPLETE', outputUrl: blendedUrl },
          })
        } catch (err) {
          await db.renderJob.update({
            where: { id: jobId },
            data: { status: 'FAILED', errorMessage: (err as Error).message },
          })
        }
      }

      if (process.env.VERCEL) {
        after(runMultiEngine)
      } else {
        void runMultiEngine()
      }

      return NextResponse.json({ jobId: renderJob.id, status: 'PROCESSING', multiEngine: true, segmentCount: segments.length })
    }
    // Single segment — fall through to standard single-engine path below
  }

  // ── Standard single-engine path ──────────────────────────────────────────
  let model: string | null = null

  if (type === 'GENERATE') {
    const p = payload as {
      prompt?: string
      model?: string
      duration?: number
      aspectRatio?: string
      quality?: string
      sceneType?: SceneType
      hasCharacterRef?: boolean
      hasLoRA?: boolean
      imageUrl?: string
      startFrameUrl?: string
    }

    if (p.imageUrl && !p.startFrameUrl) {
      p.startFrameUrl = p.imageUrl
      payload = { ...payload, startFrameUrl: p.imageUrl }
    }

    const resolvedQuality = ((): QualityTier => {
      const q = p.quality ?? quality
      if (!q) return 'standard'
      if (q === 'film_grade') return 'film'
      return q as QualityTier
    })()

    model = p.model
      ? normaliseModelId(p.model)
      : routeToModel({
          quality: resolvedQuality,
          sceneType: (p.sceneType ?? sceneType) as SceneType | undefined,
          hasCharacterRef: p.hasCharacterRef ?? Boolean(
            (payload as { characterRefs?: string[] }).characterRefs?.length
          ),
          hasLoRA: p.hasLoRA ?? Boolean((payload as { loraId?: string }).loraId),
          duration: Number(p.duration ?? 5),
          userRole,
        })
  }

  const operationKey = model
    ? getOperationCostKey(normalizeWorkerModelId(model))
    : type.toLowerCase()

  const cost = OPERATION_COSTS[operationKey] ?? 0

  try {
    await checkAndDeductCredits(userId, operationKey)
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 402 }
    )
  }

  const jobId = nanoid()

  const renderJob = await db.renderJob.create({
    data: {
      id: jobId,
      userId,
      projectId,
      type: type as never,
      status: 'QUEUED',
      modelUsed: model ?? undefined,
      creditsCharged: cost,
      inputPayload: payload as never,
      priority: getPriorityForRole(userRole),
    },
  })

  const jobData = {
    jobId: renderJob.id,
    userId,
    projectId,
    type,
    modelId: model ?? undefined,
    payload,
  }

  // On Vercel, run GENERATE inline (no separate worker process). Local/dev uses BullMQ.
  if (process.env.VERCEL && type === 'GENERATE') {
    after(async () => {
      const { processGenerateJobWithRefund } = await import('@/lib/jobs/processGenerateJob')
      try {
        await processGenerateJobWithRefund(jobData)
      } catch (err) {
        console.error('[jobs/create] inline generate failed:', err instanceof Error ? err.message : err)
      }
    })
    return NextResponse.json({ jobId: renderJob.id, status: 'PROCESSING' })
  }

  try {
    await renderQueue.add(
      'render',
      jobData,
      // attempts:1 — never auto-retry a paid fal.ai generation (each retry is
      // a fresh charge). Failures surface to the user to retry deliberately.
      { priority: getPriorityForRole(userRole), attempts: 1 }
    )
  } catch (queueErr) {
    // Queue unavailable (Redis down) — mark job failed and refund credits
    await db.renderJob.update({ where: { id: renderJob.id }, data: { status: 'FAILED', errorMessage: 'Queue unavailable' } })
    await refundCredits(userId, cost, 'queue_unavailable').catch(() => {})
    console.error('[jobs/create] Queue error:', (queueErr as Error).message)
    return NextResponse.json({ error: 'Job queue temporarily unavailable. Credits refunded.' }, { status: 503 })
  }

  return NextResponse.json({ jobId: renderJob.id, status: 'QUEUED' })
}
