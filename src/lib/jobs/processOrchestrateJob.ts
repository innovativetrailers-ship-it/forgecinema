/**
 * Director-mode orchestration — BullMQ worker + Vercel inline `after()`.
 */
import { db } from '@/lib/db'
import type { CreativeBrief } from '@/lib/cognition'
import { Prisma } from '@/generated/prisma/client'
import { appendJobProgressEvent, parseProgressEvents } from '@/lib/jobs/jobProgressEvents'
import { formatFalBalanceError } from '@/lib/fal/accountStatus'

function describeProviderError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { status?: number; message?: string; body?: { detail?: unknown } }
    const detail = e.body?.detail
    const detailStr =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail
              .map((d) => (d as { msg?: string; message?: string })?.msg ?? (d as { message?: string })?.message)
              .filter(Boolean)
              .join('; ')
          : ''
    if (detailStr) return formatFalBalanceError(detailStr)
    if (e.message) {
      const msg = e.status ? `${e.message} (${e.status})` : e.message
      return formatFalBalanceError(msg)
    }
  }
  const msg = err instanceof Error ? err.message : 'Unknown error'
  return formatFalBalanceError(msg)
}

export interface ProcessOrchestrateInput {
  jobId: string
  userId: string
  prompt: string
  duration: number
  selectedModels: string[]
  creditCost?: number
  useCognition?: boolean
  fccCognitionContext?: {
    name: string
    behavioralPrompt?: string
    wardrobeSummary?: string
    appearanceSummary?: string
  }
  projectId?: string
  generationMode?: 'draft' | 'production'
  source?: string
  heartbeat?: () => void | Promise<void>
}

export async function processOrchestrateJob(input: ProcessOrchestrateInput): Promise<void> {
  const {
    jobId,
    userId,
    prompt,
    duration,
    selectedModels,
    creditCost,
    useCognition,
    fccCognitionContext,
    projectId,
    generationMode: inputGenerationMode,
    source,
    heartbeat: inputHeartbeat,
  } = input

  const heartbeat = inputHeartbeat ?? (async () => {
    await db.renderJob.update({
      where: { id: jobId },
      data:  { updatedAt: new Date() },
    }).catch(() => {})
  })

  const { resolveOrchestrationScript } = await import('@/lib/jobs/resolveOrchestrationScript')
  const script = await resolveOrchestrationScript(jobId, { prompt })

  console.log('[orchestrate] Received job payload:', {
    prompt: script.slice(0, 100),
    jobId,
    source: source ?? 'unknown',
  })

  if (jobId) {
    const { clearDecompositionCheckpoint } = await import('@/lib/orchestration/checkpoints')
    await clearDecompositionCheckpoint(jobId)
  }
  let modelsToUse = selectedModels?.filter(Boolean) ?? []
  if (!modelsToUse.length && jobId) {
    const row = await db.renderJob.findUnique({
      where: { id: jobId },
      select: { metadata: true },
    })
    const meta = row?.metadata as { selectedModels?: string[] } | null
    if (meta?.selectedModels?.length) {
      modelsToUse = meta.selectedModels
    }
  }
  if (!modelsToUse.length) {
    throw new Error(
      `[orchestrate] Director job ${jobId} arrived with empty selectedModels (source=${source ?? 'unknown'})`,
    )
  }

  let generationMode: 'draft' | 'production' = inputGenerationMode ?? 'draft'
  if (!inputGenerationMode && jobId) {
    const row = await db.renderJob.findUnique({
      where: { id: jobId },
      select: { metadata: true },
    })
    const meta = row?.metadata as { generationMode?: string } | null
    if (meta?.generationMode === 'production') generationMode = 'production'
  }

  console.log(`[orchestrate] Model pool for job ${jobId}:`, modelsToUse, `mode=${generationMode}`)

  const jobStartTime = Date.now()
  await appendJobProgressEvent(
    jobId,
    { phase: 'starting', status: 'running', detail: 'Starting director orchestration…', pct: 2 },
    {
      status: 'PROCESSING',
      progressPct: 2,
      phase: 'patient_zero',
      statusMessage: 'Starting…',
    },
  )

  let brief: CreativeBrief | null = null

  try {
    let finalPrompt = script

    if (useCognition) {
      const { think } = await import('@/lib/cognition')
      let characterContext = fccCognitionContext ?? null
      if (!characterContext && projectId) {
        try {
          const { resolveMatchedVaultCharacter, toCognitionContext } = await import('@/lib/character/jobIdentity')
          const matched = await resolveMatchedVaultCharacter(userId, projectId, script)
          if (matched) characterContext = toCognitionContext(matched)
        } catch {
          // non-fatal
        }
      }
      await db.renderJob.update({
        where: { id: jobId },
        data: { phase: 'thinking', statusMessage: 'The director is thinking…' },
      }).catch(() => {})
      try {
        brief = await think({
          userId,
          prompt: script,
          durationSec: duration,
          characterContext,
          onProgress: async (detail) => {
            await appendJobProgressEvent(
              jobId,
              { phase: 'thinking', status: 'running', detail },
              { phase: 'thinking', statusMessage: detail },
            ).catch(() => {})
          },
        })
        finalPrompt = brief.enrichedPrompt?.trim() || script
      } catch (e) {
        console.warn('[cognition] director degraded → raw prompt:', e instanceof Error ? e.message : String(e))
        finalPrompt = script
      }
    }

    const orchestrationPrompt = (finalPrompt?.trim() || script.trim())
    if (!orchestrationPrompt) {
      throw new Error('Prompt is required for director orchestration')
    }

    const { orchestrateGeneration, PreflightError } = await import('@/lib/orchestration')
    const { settleHold, getHold } = await import('@/lib/credits/escrow')
    const { NeedsAttentionError, BudgetCapReached } = await import('@/lib/orchestration/budget')

    let result: Awaited<ReturnType<typeof orchestrateGeneration>>
    try {
      const jobRow = await db.renderJob.findUnique({
        where: { id: jobId },
        select: { metadata: true, projectId: true },
      })
      const jobMeta = (jobRow?.metadata as Record<string, unknown>) ?? {}
      let musicUrl: string | undefined
      let ambienceUrl: string | undefined
      const pid = projectId ?? jobRow?.projectId ?? undefined
      if (pid) {
        const proj = await db.project.findUnique({
          where: { id: pid },
          select: { musicUrl: true, ambienceUrl: true },
        })
        musicUrl = proj?.musicUrl ?? (typeof jobMeta.musicUrl === 'string' ? jobMeta.musicUrl : undefined)
        ambienceUrl = proj?.ambienceUrl ?? (typeof jobMeta.ambienceUrl === 'string' ? jobMeta.ambienceUrl : undefined)
      }

      result = await orchestrateGeneration({
        prompt: orchestrationPrompt,
        totalDuration: duration,
        selectedModels: modelsToUse,
        userId,
        jobId,
        projectId: pid,
        musicUrl,
        ambienceUrl,
        generationMode,
        heartbeat,
        onProgress: async (phase, detail, pct) => {
        const elapsedSec = (Date.now() - jobStartTime) / 1000
        const etaSeconds = pct > 5 ? Math.max(0, Math.round((elapsedSec / pct) * (100 - pct))) : null
        await appendJobProgressEvent(
          jobId,
          {
            phase,
            status: pct >= 100 ? 'completed' : 'running',
            detail,
            pct,
          },
          {
            progressPct: pct,
            phase,
            statusMessage: detail,
            ...(etaSeconds !== null ? { etaSeconds } : {}),
          },
        ).catch(() => {})
        },
      })
    } catch (orchErr) {
      if (orchErr instanceof PreflightError) {
        await appendJobProgressEvent(
          jobId,
          { phase: 'preflight_failed', status: 'failed', detail: orchErr.message },
          { status: 'FAILED', errorMessage: orchErr.message, statusMessage: 'Preflight failed' },
        ).catch(() => {})
        throw orchErr
      }
      if (orchErr instanceof NeedsAttentionError || orchErr instanceof BudgetCapReached) {
        const phase = orchErr instanceof BudgetCapReached ? 'budget_cap_reached' : 'paused_needs_attention'
        await appendJobProgressEvent(
          jobId,
          { phase, status: 'paused', detail: orchErr.message },
          { status: 'NEEDS_ATTENTION', statusMessage: orchErr.message },
        ).catch(() => {})
        return
      }
      const hold = await getHold(jobId)
      if (hold?.status === 'ACTIVE') {
        await settleHold(jobId)
      }
      throw orchErr
    }

    const settlement = await settleHold(jobId)
    const actualCredits = settlement?.used ?? result.totalCredits

    await appendJobProgressEvent(
      jobId,
      { phase: 'complete', status: 'completed', detail: 'Film complete', pct: 100 },
      {
        status: 'COMPLETE',
        progressPct: 100,
        phase: 'complete',
        etaSeconds: 0,
        statusMessage: 'Complete',
        outputUrl: result.finalVideoUrl,
        completedAt: new Date(),
      },
    )

    const row = await db.renderJob.findUnique({ where: { id: jobId }, select: { metadata: true } })
    const prevMeta = (row?.metadata as Record<string, unknown>) ?? {}
    const progressEvents = parseProgressEvents(prevMeta)

    await db.renderJob.update({
      where: { id: jobId },
      data: {
        metadata: {
          ...prevMeta,
          progressEvents,
          segments: result.segments,
          modelBreakdown: result.modelBreakdown,
          qualityScores: result.qualityScores,
          patientZero: result.patientZero,
          actualCredits,
          escrowSettlement: settlement,
        } as unknown as Prisma.InputJsonValue,
      },
    })

    const { learn } = await import('@/lib/cognition')
    learn({
      userId,
      jobId,
      result: {
        segments: result.segments ?? [],
        qualityScores: Object.fromEntries(Object.entries(result.qualityScores ?? {})),
      },
      brief,
    }).catch((e) => console.warn('[learn]', e instanceof Error ? e.message : String(e)))
  } catch (err) {
    const { CanaryFailure } = await import('@/lib/orchestration/chainGeneration')
    const msg = describeProviderError(err)
    const isCanary = err instanceof CanaryFailure
    await appendJobProgressEvent(
      jobId,
      { phase: isCanary ? 'canary_failed' : 'failed', status: 'failed', detail: msg },
      {
        status: 'FAILED',
        errorMessage: msg,
        statusMessage: isCanary ? 'Pipeline validation failed' : 'Generation failed',
      },
    ).catch(() => {})
    throw err
  }
}

export async function processOrchestrateJobWithRefund(input: ProcessOrchestrateInput): Promise<void> {
  try {
    await processOrchestrateJob(input)
  } catch (err) {
    const { getHold, settleHold } = await import('@/lib/credits/escrow')
    const hold = await getHold(input.jobId)
    if (hold?.status === 'ACTIVE') {
      await settleHold(input.jobId)
    }
    throw err
  }
}

export interface ProcessRenderSimpleInput {
  jobId: string
  userId: string
  prompt: string
  duration: number
  engine: string
}

export async function processRenderSimpleJob(input: ProcessRenderSimpleInput): Promise<void> {
  const { jobId, prompt, duration, engine } = input

  await appendJobProgressEvent(
    jobId,
    { phase: 'generating', status: 'running', detail: 'Generating video…', pct: 20 },
    { status: 'PROCESSING', progressPct: 20, phase: 'generating', statusMessage: 'Generating video…' },
  )

  try {
    const { callEngine } = await import('@/lib/routing/MediaRouter')
    const result = await callEngine({ model: engine, prompt, duration })
    await appendJobProgressEvent(
      jobId,
      { phase: 'complete', status: 'completed', detail: 'Complete', pct: 100 },
      {
        status: 'COMPLETE',
        progressPct: 100,
        phase: 'complete',
        etaSeconds: 0,
        statusMessage: 'Complete',
        outputUrl: result.videoUrl ?? result.imageUrl,
        completedAt: new Date(),
      },
    )
  } catch (err) {
    const msg = describeProviderError(err)
    await appendJobProgressEvent(
      jobId,
      { phase: 'failed', status: 'failed', detail: msg },
      { status: 'FAILED', errorMessage: msg, statusMessage: 'Generation failed' },
    ).catch(() => {})
    throw err
  }
}
