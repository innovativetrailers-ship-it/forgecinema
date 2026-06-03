// Suppress expected teardown errors that fire when Redis/BullMQ connections
// close in non-deterministic order during graceful shutdown.
const TEARDOWN_MSGS = ['Connection is closed', "stream isn't writeable", 'ECONNRESET']
process.on('uncaughtException', (err) => {
  if (TEARDOWN_MSGS.some((m) => err.message?.includes(m))) return
  console.error('[render-worker] Uncaught exception:', err)
  process.exit(1)
})
process.on('unhandledRejection', (reason) => {
  const msg = (reason as Error)?.message ?? String(reason)
  if (TEARDOWN_MSGS.some((m) => msg.includes(m))) return
  console.error('[render-worker] Unhandled rejection:', reason)
})

import { Worker } from 'bullmq'
import { redis, bullmqRedis, bullMQPrefix } from '../../redis'
import { startHeartbeat } from '../heartbeat'
import { db } from '../../db'
import { broadcastJobEvent } from '../events'
import { refundCredits } from '../../credits'
import { checkNSFW } from '../../moderation/nsfw'
import { logApiUsage, logRLHFSelection } from '../../telemetry/rlhf'
import { captureGeneration } from '../../telemetry/delta'
import { loraAutoTrigger, incrementRenderCount } from '../../vault/lora-trigger'
import type { GenerateVideoOutput } from '../../models/types'

const POLL_INTERVAL_MS = 4000
// fal video models can sit in-queue for 15+ min under load before execution.
// Keep this comfortably above observed worst-case so we don't fail jobs that
// fal will still complete (the result is fetched as soon as it flips COMPLETED).
const JOB_TIMEOUT_MS = 25 * 60 * 1000 // 25 minutes

// fal.ai (and other providers) throw errors whose useful text lives in
// `body.detail` rather than `message` (which is just "Forbidden"/"Bad Request").
// Extract a user-facing message and give the common balance-lock a clear copy.
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
    if (/exhausted balance|user is locked/i.test(detailStr)) {
      return 'AI provider account is out of balance. Top up fal.ai billing to resume generation.'
    }
    if (detailStr) return detailStr
    if (e.message) return e.status ? `${e.message} (${e.status})` : e.message
  }
  return err instanceof Error ? err.message : 'Unknown error'
}

type JobType =
  | 'GENERATE'
  | 'REPAINT'
  | 'RELIGHT'
  | 'UPSCALE'
  | 'EXPORT'
  | 'LORA_TRAIN'
  | 'LIPSYNC'
  | 'AUTO_SOCIAL'
  | 'TRANSCRIBE'
  | 'CGI_INSERT'

interface RenderJobPayload {
  jobId: string
  userId: string
  projectId?: string
  type: JobType
  modelId?: string
  payload: Record<string, unknown>
}

async function dispatchToModel(
  modelId: string,
  payload: Record<string, unknown>
): Promise<GenerateVideoOutput> {
  const input = {
    prompt: (payload.prompt as string) ?? '',
    negativePrompt: payload.negativePrompt as string | undefined,
    duration: (payload.duration as number) ?? 5,
    aspectRatio: ((payload.aspectRatio as string) ?? '16:9') as GenerateVideoOutput extends { status: string } ? never : '16:9' | '9:16' | '1:1' | '4:3' | '21:9',
    startFrameUrl: payload.startFrameUrl as string | undefined,
    endFrameUrl: payload.endFrameUrl as string | undefined,
    characterRefs: payload.characterRefs as string[] | undefined,
    loraId: payload.loraId as string | undefined,
    cameraMotion: payload.cameraMotion as string | undefined,
    motionStrength: payload.motionStrength as number | undefined,
    seed: payload.seed as number | undefined,
  }

  const aspectRatio = (input.aspectRatio ?? '16:9') as '16:9' | '9:16' | '1:1' | '4:3' | '21:9'
  const validInput = { ...input, aspectRatio }

  switch (modelId) {
    case 'kling_standard':
    case 'kling': {
      const kling = await import('../../models/kling')
      return kling.generateVideo(validInput, 'standard')
    }
    case 'kling_pro': {
      const kling = await import('../../models/kling')
      return kling.generateVideo(validInput, 'pro')
    }
    case 'veo3': {
      const veo3 = await import('../../models/veo3')
      return veo3.generateVideo(validInput)
    }
    case 'luma': {
      const luma = await import('../../models/luma')
      return luma.generateVideo(validInput)
    }
    case 'runway': {
      const runway = await import('../../models/runway')
      return runway.generateVideo(validInput)
    }
    case 'pika': {
      const pika = await import('../../models/pika')
      return pika.generateVideo(validInput)
    }
    case 'minimax': {
      const minimax = await import('../../models/minimax')
      return minimax.generateVideo(validInput)
    }
    case 'seedance': {
      const seedance = await import('../../models/seedance')
      return seedance.generateVideo(validInput)
    }
    case 'wan':
    case 'animatediff': {
      const wan = await import('../../models/wan')
      return wan.generateVideo(validInput)
    }
    case 'svd': {
      const svd = await import('../../models/svd')
      return svd.generateVideo(validInput)
    }
    default: {
      const wan = await import('../../models/wan')
      return wan.generateVideo(validInput)
    }
  }
}

async function pollUntilComplete(
  modelId: string,
  externalJobId: string,
  internalJobId: string,
  startedAt: number
): Promise<GenerateVideoOutput> {
  while (true) {
    if (Date.now() - startedAt > JOB_TIMEOUT_MS) {
      throw new Error('Job timed out after 25 minutes')
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    let result: GenerateVideoOutput

    switch (modelId) {
      case 'kling_standard':
      case 'kling': {
        const kling = await import('../../models/kling')
        result = await kling.pollStatus(externalJobId, 'standard')
        break
      }
      case 'kling_pro': {
        const kling = await import('../../models/kling')
        result = await kling.pollStatus(externalJobId, 'pro')
        break
      }
      case 'veo3': {
        const veo3 = await import('../../models/veo3')
        result = await veo3.pollStatus(externalJobId)
        break
      }
      case 'luma': {
        const luma = await import('../../models/luma')
        result = await luma.pollStatus(externalJobId)
        break
      }
      case 'runway': {
        const runway = await import('../../models/runway')
        result = await runway.pollStatus(externalJobId)
        break
      }
      case 'pika': {
        const pika = await import('../../models/pika')
        result = await pika.pollStatus(externalJobId)
        break
      }
      case 'minimax': {
        const minimax = await import('../../models/minimax')
        result = await minimax.pollStatus(externalJobId)
        break
      }
      case 'seedance': {
        const seedance = await import('../../models/seedance')
        result = await seedance.pollStatus(externalJobId)
        break
      }
      default: {
        const wan = await import('../../models/wan')
        result = await wan.pollStatus(externalJobId)
        break
      }
    }

    // Broadcast progress
    const progress = result.status === 'processing' ? 50 : 0
    await broadcastJobEvent({
      jobId: internalJobId,
      status: 'processing',
      progress,
      message: `${modelId} processing…`,
    })

    await db.renderJob.update({
      where: { id: internalJobId },
      data: { progressPct: progress },
    })

    if (result.status === 'complete' || result.status === 'failed') {
      return result
    }
  }
}

async function handleGenerateJob(data: RenderJobPayload): Promise<void> {
  const { jobId, userId, modelId, payload } = data
  const modelName = modelId ?? 'wan'
  const startedAt = Date.now()

  // Dispatch to model
  await broadcastJobEvent({ jobId, status: 'processing', progress: 5, message: 'Submitting to model…' })

  const initial = await dispatchToModel(modelName, payload)

  if (initial.status === 'failed') {
    throw new Error(initial.error ?? 'Model submission failed')
  }

  // Poll until done
  const result = await pollUntilComplete(
    modelName,
    initial.jobId,
    jobId,
    startedAt
  )

  if (result.status === 'failed') {
    throw new Error(result.error ?? 'Model generation failed')
  }

  const videoUrl = result.videoUrl!
  const latencyMs = Date.now() - startedAt

  // Content moderation check
  await broadcastJobEvent({ jobId, status: 'processing', progress: 85, message: 'Running safety check…' })
  const moderation = await checkNSFW(videoUrl, 'video')

  if (!moderation.safe) {
    throw new Error('Content flagged by safety filter. Please revise your prompt.')
  }

  // Queue for DAS ingestion
  await redis.rpush(
    'das:queue',
    JSON.stringify({ jobId, videoUrl, projectId: data.projectId, userId, type: data.type })
  )

  // Update DB
  await db.renderJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETE',
      outputUrl: videoUrl,
      progressPct: 100,
      processingMs: latencyMs,
      completedAt: new Date(),
    },
  })

  // Telemetry
  await Promise.allSettled([
    logApiUsage({
      provider: modelName,
      model: modelName,
      userId,
      jobId,
      costCents: 0,
      latencyMs,
      success: true,
    }),
    captureGeneration({
      userId,
      prompt: (payload.prompt as string) ?? '',
      modelUsed: modelName,
      outputUrl: videoUrl,
      inputPayload: payload,
    }),
  ])

  // LoRA auto-trigger if character was used
  const characterId = payload.characterId as string | undefined
  if (characterId) {
    await incrementRenderCount(characterId)
    await loraAutoTrigger(characterId, userId)
  }

  await broadcastJobEvent({
    jobId,
    status: 'complete',
    progress: 100,
    message: 'Complete!',
    outputUrl: videoUrl,
  })
}

async function handleTranscribeJob(data: RenderJobPayload): Promise<void> {
  const { jobId, userId, payload } = data
  const audioUrl = payload.audioUrl as string

  await broadcastJobEvent({ jobId, status: 'processing', progress: 20, message: 'Transcribing…' })

  const { transcribeAudio } = await import('../../fal/sync')
  const result = await transcribeAudio(audioUrl)

  await db.renderJob.update({
    where: { id: jobId },
    data: {
      status: 'COMPLETE',
      outputUrl: audioUrl,
      progressPct: 100,
      completedAt: new Date(),
    },
  })

  await broadcastJobEvent({
    jobId,
    status: 'complete',
    progress: 100,
    outputUrl: audioUrl,
    message: result.text.slice(0, 100),
  })

  // Silence unused var warning
  void userId
}

export const renderWorker = new Worker<RenderJobPayload>(
  'render',
  async (job) => {
    const data = job.data

    // ── V2: orchestrate / render-simple job names ───────────────────────────
    if (job.name === 'orchestrate') {
      const { jobId, userId, prompt, duration, selectedModels, creditCost } = data as unknown as {
        jobId: string; userId: string; prompt: string
        duration: number; selectedModels: string[]; creditCost?: number
      }
      const jobStartTime = Date.now()
      await db.renderJob.update({
        where: { id: jobId },
        data:  { status: 'PROCESSING', progressPct: 2, phase: 'patient_zero', statusMessage: 'Starting…' },
      })
      try {
        const { orchestrateGeneration } = await import('@/lib/orchestration')
        const result = await orchestrateGeneration({
          prompt, totalDuration: duration, selectedModels, userId,
          onProgress: async (phase, detail, pct) => {
            const elapsedSec = (Date.now() - jobStartTime) / 1000
            const etaSeconds = pct > 5 ? Math.max(0, Math.round((elapsedSec / pct) * (100 - pct))) : null
            await db.renderJob.update({
              where: { id: jobId },
              data: { progressPct: pct, phase, statusMessage: detail, ...(etaSeconds !== null ? { etaSeconds } : {}) },
            }).catch(() => {})
          },
        })
        // Cost reconciliation
        const estimatedCredits = creditCost ?? result.totalCredits
        const refund = estimatedCredits - result.totalCredits
        if (refund > 0) {
          const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
          if (user?.role !== 'ADMIN') {
            await db.user.update({ where: { id: userId }, data: { creditBalance: { increment: refund } } })
            await db.creditTransaction.create({ data: { userId, amount: refund, description: 'Orchestration cost reconciliation refund', balanceAfter: 0 } })
          }
        }
        await db.renderJob.update({
          where: { id: jobId },
          data: { status: 'COMPLETE', progressPct: 100, phase: 'complete', etaSeconds: 0, statusMessage: 'Complete', outputUrl: result.finalVideoUrl, completedAt: new Date() },
        })
      } catch (err) {
        const msg = describeProviderError(err)
        await db.renderJob.update({ where: { id: jobId }, data: { status: 'FAILED', errorMessage: msg, statusMessage: 'Generation failed' } })
        throw err
      }
      return
    }

    if (job.name === 'render-simple') {
      const { jobId, prompt, duration, engine, userId } = data as unknown as {
        jobId: string; prompt: string; duration: number; engine: string; userId: string
      }
      await db.renderJob.update({
        where: { id: jobId },
        data: { status: 'PROCESSING', progressPct: 20, phase: 'generating', statusMessage: 'Generating video…' },
      })
      try {
        const { callEngine } = await import('@/lib/routing/MediaRouter')
        const result = await callEngine({ model: engine, prompt, duration })
        await db.renderJob.update({
          where: { id: jobId },
          data: { status: 'COMPLETE', progressPct: 100, phase: 'complete', etaSeconds: 0, statusMessage: 'Complete', outputUrl: result.videoUrl ?? result.imageUrl, completedAt: new Date() },
        })
      } catch (err) {
        const msg = describeProviderError(err)
        await db.renderJob.update({ where: { id: jobId }, data: { status: 'FAILED', errorMessage: msg, statusMessage: 'Generation failed' } })
        throw err
      }
      return
    }

    if (job.name === 'music') {
      const { jobId, userId: uid, prompt, style, durationSecs, instrumental, title } = data as unknown as {
        jobId: string; userId: string; prompt: string; style?: string
        durationSecs?: number; instrumental?: boolean; title?: string
      }
      const startTime = Date.now()
      await db.renderJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', progressPct: 5, statusMessage: 'Suno composing…' } })
      try {
        const { generateMusicWithProgress } = await import('@/lib/engines/suno')
        const result = await generateMusicWithProgress(
          { prompt, style, duration: durationSecs, instrumental, title },
          async (pct, message) => {
            const elapsed    = (Date.now() - startTime) / 1000
            const etaSeconds = pct > 5 ? Math.max(0, Math.round((elapsed / pct) * (100 - pct))) : null
            await db.renderJob.update({
              where: { id: jobId },
              data: { progressPct: pct, statusMessage: message, ...(etaSeconds !== null ? { etaSeconds } : {}) },
            }).catch(() => {})
          }
        )
        const { uploadToR2 } = await import('@/lib/storage/r2')
        const buf    = await fetch(result.audioUrl).then(r => r.arrayBuffer())
        const r2Url  = await uploadToR2(Buffer.from(buf), `music/${uid}/${Date.now()}.mp3`, 'audio/mpeg')
        await db.renderJob.update({
          where: { id: jobId },
          data: { status: 'COMPLETE', progressPct: 100, etaSeconds: 0, statusMessage: 'Complete', outputUrl: r2Url, completedAt: new Date() },
        })
      } catch (err) {
        const msg = describeProviderError(err)
        await db.renderJob.update({ where: { id: jobId }, data: { status: 'FAILED', errorMessage: msg, statusMessage: 'Music generation failed' } })
        throw err
      }
      return
    }

    if (job.name === 'voice') {
      const { jobId, userId: uid, text, voiceId, stability, similarity } = data as unknown as {
        jobId: string; userId: string; text: string; voiceId?: string; stability?: number; similarity?: number
      }
      await db.renderJob.update({ where: { id: jobId }, data: { status: 'PROCESSING', progressPct: 10, statusMessage: 'Synthesising voice…' } })
      try {
        const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text]
        const total     = sentences.length
        const parts: Buffer[] = []
        for (let i = 0; i < sentences.length; i++) {
          const { synthesiseVoice } = await import('@/lib/engines/elevenLabs')
          const buf = await synthesiseVoice({ text: sentences[i].trim(), voiceId, stability, similarity })
          parts.push(buf)
          const pct = Math.round(((i + 1) / total) * 90)
          await db.renderJob.update({
            where: { id: jobId },
            data: { progressPct: pct, statusMessage: `Synthesising voice ${i + 1}/${total}` },
          }).catch(() => {})
        }
        const combined = Buffer.concat(parts)
        const { uploadToR2 } = await import('@/lib/storage/r2')
        const r2Url = await uploadToR2(combined, `audio/${uid}/${Date.now()}.mp3`, 'audio/mpeg')
        await db.renderJob.update({
          where: { id: jobId },
          data: { status: 'COMPLETE', progressPct: 100, etaSeconds: 0, statusMessage: 'Complete', outputUrl: r2Url, completedAt: new Date() },
        })
      } catch (err) {
        const msg = describeProviderError(err)
        await db.renderJob.update({ where: { id: jobId }, data: { status: 'FAILED', errorMessage: msg, statusMessage: 'Voice synthesis failed' } })
        throw err
      }
      return
    }

    // ── Legacy GENERATE / REPAINT / TRANSCRIBE jobs ─────────────────────────
    // Mark processing in DB
    await db.renderJob.update({
      where: { id: data.jobId },
      data: { status: 'PROCESSING' },
    })

    await broadcastJobEvent({
      jobId: data.jobId,
      status: 'processing',
      progress: 2,
      message: 'Job started…',
    })

    try {
      switch (data.type) {
        case 'GENERATE':
        case 'REPAINT':
          await handleGenerateJob(data)
          break
        case 'TRANSCRIBE':
          await handleTranscribeJob(data)
          break
        default:
          await handleGenerateJob(data)
      }
    } catch (err) {
      const message = describeProviderError(err)

      // Refund credits
      const renderJob = await db.renderJob.findUnique({
        where: { id: data.jobId },
        select: { creditsCharged: true },
      })

      if (renderJob?.creditsCharged) {
        await refundCredits(
          data.userId,
          renderJob.creditsCharged,
          `Refund for failed job ${data.jobId}: ${message}`
        )
      }

      await db.renderJob.update({
        where: { id: data.jobId },
        data: {
          status: 'FAILED',
          errorMessage: message,
          completedAt: new Date(),
        },
      })

      await broadcastJobEvent({
        jobId: data.jobId,
        status: 'failed',
        error: message,
      })

      await logApiUsage({
        provider: data.modelId ?? 'unknown',
        model: data.modelId ?? 'unknown',
        userId: data.userId,
        jobId: data.jobId,
        costCents: 0,
        latencyMs: 0,
        success: false,
      })

      // Re-throw so BullMQ can handle retries
      throw err
    }
  },
  {
    connection: bullmqRedis,
    prefix: bullMQPrefix,
    concurrency: 5,
    limiter: { max: 20, duration: 60000 },
    // A full Director-mode film (multi-segment, slow open-source models) can run
    // 30-60+ min. Lock must exceed the longest possible render or BullMQ marks the
    // job stalled and (with maxStalledCount>0) re-runs it mid-flight.
    lockDuration:    10_800_000, // 3 hours
    lockRenewTime:   300_000,    // renew every 5 min so long jobs keep their claim
    stalledInterval: 300_000,    // check for genuinely stalled jobs every 5 min
    // Cost safety: a stalled job (worker crash/redeploy mid-render) must NOT be
    // re-run — re-running re-submits to fal.ai and charges again. Fail it once.
    maxStalledCount: 0,
  }
)

renderWorker.on('failed', (job, err) => {
  const e = err as Error & { code?: string; meta?: unknown }
  console.error(
    `[render-worker] Job ${job?.id} failed: name=${e?.name} code=${e?.code ?? 'n/a'} msg=${e?.message}`,
  )
  if (e?.meta) console.error('[render-worker] meta:', JSON.stringify(e.meta))
  if (e?.stack) console.error('[render-worker] stack:', e.stack)
})

renderWorker.on('completed', (job) => {
  console.log(`[render-worker] Job ${job.id} completed`)
})

// Publish liveness heartbeat
const stopHeartbeat = startHeartbeat('render-worker')
process.on('SIGTERM', () => { stopHeartbeat(); process.exit(0) })
process.on('SIGINT', () => { stopHeartbeat(); process.exit(0) })

// Silence unused import
void logRLHFSelection
