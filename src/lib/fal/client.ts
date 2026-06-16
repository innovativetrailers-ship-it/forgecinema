// Single source for all FAL calls — routes through falQueue (URL-based polling).

import { fal as falSdk } from '@fal-ai/client'
import { getFalKey } from '@/lib/config/keys'
import { assertGenerationNotPaused } from '@/lib/generation/pause'
import {
  parseFalSubmission,
  pollFalStatusOnce,
  runFalQueue,
  serializeFalSubmission,
  submitToFal,
  type FalQueueStatus,
  type FalSubmission,
} from './falQueue'
import { falWithTimeout, type FalProgressUpdate, type FalWithTimeoutOptions } from './withTimeout'

export { FalValidationError } from './falErrors'
export { FalTimeoutError, IMAGE_FAL_TIMEOUT_MS } from './withTimeout'
export type { FalProgressUpdate } from './withTimeout'
export type { FalSubmission, FalQueueStatus } from './falQueue'
export {
  submitToFal,
  pollFalStatusOnce,
  serializeFalSubmission,
  parseFalSubmission,
  runFalQueue,
} from './falQueue'

falSdk.config({ credentials: getFalKey() })

interface FalPayload {
  detail?: string
  error?: string
}

/**
 * Run any FAL model through the queue (status/response URLs from FAL).
 */
export async function runFal<T = unknown>(
  modelId: string,
  input: Record<string, unknown>,
  onProgress?: (update: FalProgressUpdate) => void,
  timeoutMs: number = 1_200_000,
  onPoll?: () => void | Promise<void>,
  checkpoint?: FalWithTimeoutOptions['checkpoint'],
): Promise<T> {
  return falWithTimeout<T>(modelId, input, timeoutMs, { onProgress, onPoll, checkpoint })
}

/**
 * SDK-compatible facade — subscribe delegates to runFal.
 */
const guardedQueue = {
  ...falSdk.queue,
  submit: async (
    endpoint: string,
    options: { input: Record<string, unknown> } & Record<string, unknown>,
  ) => {
    assertGenerationNotPaused(endpoint)
    return falSdk.queue.submit(endpoint, options)
  },
}

export const fal = {
  subscribe: async <T = unknown>(
    modelId: string,
    options: { input: Record<string, unknown> } & Record<string, unknown>,
  ): Promise<{ data: T }> => {
    assertGenerationNotPaused(modelId)
    const data = await runFal<T>(modelId, options.input)
    return { data }
  },
  queue: guardedQueue,
  storage: falSdk.storage,
}

/** Upload an image/mask to FAL storage and get a URL. */
export async function uploadToFal(
  data: Blob | File | Buffer | string,
): Promise<string> {
  let file: Blob
  if (typeof data === 'string') {
    const base64 = data.includes(',') ? data.split(',')[1]! : data
    const mime = data.startsWith('data:') ? data.split(';')[0]!.split(':')[1]! : 'image/png'
    const bytes = Buffer.from(base64, 'base64')
    file = new Blob([bytes], { type: mime })
  } else if (Buffer.isBuffer(data)) {
    file = new Blob([new Uint8Array(data)])
  } else {
    file = data
  }
  return await fal.storage.upload(file)
}

export function extractVideoUrl(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const d = data as Record<string, unknown>
  const video = d.video as { url?: string } | undefined
  if (video?.url) return video.url
  if (typeof d.video_url === 'string') return d.video_url
  const output = d.output as { video?: { url?: string } } | undefined
  if (output?.video?.url) return output.video.url
  if (typeof d.url === 'string') return d.url
  return undefined
}

/** Submit to FAL queue — returns request id (legacy) + pollUrl with full submission. */
export async function submitFalQueue(
  modelId: string,
  input: Record<string, unknown>,
): Promise<string> {
  const submission = await submitToFal(modelId, input)
  return submission.requestId
}

/** Returns full submission for polling (preferred over submitFalQueue). */
export async function submitFalQueueFull(
  modelId: string,
  input: Record<string, unknown>,
): Promise<FalSubmission> {
  return submitToFal(modelId, input)
}

/** Poll FAL queue using persisted submission (pollUrl JSON or FalSubmission). */
export async function pollFalQueue(
  submissionOrPollUrl: FalSubmission | string,
): Promise<{ status: FalQueueStatus; data?: unknown; error?: string }> {
  const submission = typeof submissionOrPollUrl === 'string'
    ? parseFalSubmission(submissionOrPollUrl)
    : submissionOrPollUrl

  if (!submission) {
    return {
      status: 'FAILED',
      error: 'Invalid or missing FAL submission — cannot poll without status_url from submit',
    }
  }

  return pollFalStatusOnce(submission)
}

export function extractImageUrl(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const d = data as Record<string, unknown>
  const images = d.images as Array<{ url?: string }> | undefined
  if (images?.[0]?.url) return images[0].url
  const image = d.image as { url?: string } | undefined
  if (image?.url) return image.url
  const output = d.output as { image?: { url?: string } } | undefined
  if (output?.image?.url) return output.image.url
  if (typeof d.url === 'string') return d.url
  return undefined
}
