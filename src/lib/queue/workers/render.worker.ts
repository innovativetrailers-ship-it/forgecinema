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
const JOB_TIMEOUT_MS = 10 * 60 * 1000 // 10 minutes

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
      throw new Error('Job timed out after 10 minutes')
    }

    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))

    let result: GenerateVideoOutput

    switch (modelId) {
      case 'kling_standard':
      case 'kling':
      case 'kling_pro': {
        const kling = await import('../../models/kling')
        result = await kling.pollStatus(externalJobId)
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
      const message = err instanceof Error ? err.message : 'Unknown error'

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
  }
)

renderWorker.on('failed', (job, err) => {
  console.error(`[render-worker] Job ${job?.id} failed:`, err.message)
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
