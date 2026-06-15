import { runFal, extractVideoUrl, extractImageUrl } from '@/lib/fal/client'
import { getEndpointTimeout } from '@/lib/fal/falQueue'
import { assertModelIntegrity } from '@/lib/models/modelIntegrity'
import type { ModelDef } from '@/lib/models/resolve'
import { resolveVideoEndpoint } from '@/lib/models/resolve'
import { T2V_MODEL_IDS } from '@/lib/orchestration/falEndpoints'
import type { SubProgressFn } from '@/lib/orchestration/types'

function segmentIdForShot(shotIndex: number): string {
  return `shot-${shotIndex}`
}

async function callFalModel(
  modelId: string,
  input: Record<string, unknown>,
  onSubProgress?: (pct: number, message: string) => void,
  timeoutMs?: number,
  onPoll?: () => void | Promise<void>,
  checkpoint?: { jobId: string; segmentId: string; shotId: number },
): Promise<string> {
  const submittedAt = Date.now()
  let inferenceLogged = false
  const falCheckpoint = checkpoint
    ? {
        load: async () => {
          const { loadSubmissionCheckpoint } = await import('@/lib/orchestration/checkpoints')
          return loadSubmissionCheckpoint(checkpoint.jobId, checkpoint.segmentId)
        },
        save: async (submission: import('@/lib/fal/falQueue').FalSubmission) => {
          const { saveSubmissionCheckpoint } = await import('@/lib/orchestration/checkpoints')
          await saveSubmissionCheckpoint(
            checkpoint.jobId,
            checkpoint.segmentId,
            checkpoint.shotId,
            submission,
          )
        },
        clear: async () => {
          const { clearSubmissionCheckpoint } = await import('@/lib/orchestration/checkpoints')
          await clearSubmissionCheckpoint(checkpoint.jobId, checkpoint.segmentId)
        },
      }
    : undefined

  const data = await runFal(
    modelId,
    input,
    (update) => {
      if (update.status === 'IN_QUEUE') {
        const pos = update.position
        console.log(
          `[fal:${modelId}] in queue ${Math.round((Date.now() - submittedAt) / 1000)}s, position ${pos ?? '?'}`,
        )
        onSubProgress?.(0, `Queued (position ${pos ?? '?'})`)
      } else if (update.status === 'IN_PROGRESS') {
        if (!inferenceLogged) {
          console.log(
            `[fal:${modelId}] inference started after ${Math.round((Date.now() - submittedAt) / 1000)}s queue`,
          )
          inferenceLogged = true
        }
        onSubProgress?.(50, update.message ?? 'Generating…')
      }
    },
    timeoutMs ?? getEndpointTimeout(modelId),
    onPoll,
    falCheckpoint,
  )
  console.log(`[fal:${modelId}] complete after ${Math.round((Date.now() - submittedAt) / 1000)}s total`)

  const payload = data as { detail?: string; error?: string }
  if (payload?.detail === 'Not Found' || payload?.error?.includes('404')) {
    throw new Error(`FAL endpoint not found: ${modelId} — update registry`)
  }

  const url = extractVideoUrl(data) ?? extractImageUrl(data)
  if (!url) throw new Error(`fal model ${modelId} returned no video URL`)
  return url
}

export interface FalVideoParams {
  registryModel: string
  prompt: string
  duration: number
  imageUrl?: string
  endImageUrl?: string
  patientZeroUrl?: string
  jobId?: string
  shotIndex?: number
  onSubProgress?: SubProgressFn
  onPoll?: () => void | Promise<void>
}

export async function falVideo(
  _model: ModelDef,
  registryModel: string,
  params: FalVideoParams,
): Promise<string> {
  const hasStartFrame = Boolean(params.imageUrl)
  const modelId =
    resolveVideoEndpoint(registryModel, hasStartFrame) ?? T2V_MODEL_IDS[registryModel]

  if (!modelId) throw new Error(`Unknown FAL model: ${registryModel}`)

  const useI2V = hasStartFrame && modelId === resolveVideoEndpoint(registryModel, true)

  const { buildFalVideoInput } = await import('@/lib/fal/videoPayloads')
  const input = await buildFalVideoInput(modelId, registryModel, {
    prompt: params.prompt,
    duration: params.duration,
    aspectRatio: '16:9',
    imageUrl: useI2V ? params.imageUrl : undefined,
    endImageUrl: params.endImageUrl,
    audioPolicy: 'elevenlabs',
  })
  if (params.patientZeroUrl) {
    input.reference_image_url = params.patientZeroUrl
  }

  assertModelIntegrity(params.registryModel, _model, modelId, hasStartFrame)

  return callFalModel(
    modelId,
    input,
    (pct, message) => params.onSubProgress?.({ pct, message, vendor: 'fal' }),
    getEndpointTimeout(modelId),
    params.onPoll,
    params.jobId && params.shotIndex !== undefined
      ? {
          jobId: params.jobId,
          segmentId: segmentIdForShot(params.shotIndex),
          shotId: params.shotIndex,
        }
      : undefined,
  )
}
