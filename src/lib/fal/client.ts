// Single source for all FAL calls — always uses the queue endpoint via subscribe

import { fal } from '@fal-ai/client'

fal.config({ credentials: process.env.FAL_API_KEY })

export { fal }

export interface FalProgressUpdate {
  status:   'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED'
  position?: number
  message?:  string
}

interface FalQueueLog {
  message?: string
}

interface FalQueueUpdate {
  status?:          string
  queue_position?:  number
  logs?:            FalQueueLog[]
}

interface FalPayload {
  detail?: string
  error?:  string
}

/**
 * Run any FAL model through the QUEUE endpoint (no sync timeout).
 * Returns the data payload. Throws on FAL errors.
 */
export async function runFal<T = unknown>(
  modelId: string,
  input:   Record<string, unknown>,
  onProgress?: (update: FalProgressUpdate) => void,
  timeoutMs: number = 1_200_000,
): Promise<T> {
  const result = await fal.subscribe(modelId, {
    input,
    logs:    true,
    timeout: timeoutMs,
    onQueueUpdate: (update: FalQueueUpdate) => {
      if (update.status === 'IN_QUEUE') {
        onProgress?.({ status: 'IN_QUEUE', position: update.queue_position })
      } else if (update.status === 'IN_PROGRESS') {
        const msg = update.logs?.slice(-1)[0]?.message ?? 'Processing...'
        onProgress?.({ status: 'IN_PROGRESS', message: msg })
      } else if (update.status === 'COMPLETED') {
        onProgress?.({ status: 'COMPLETED' })
      }
    },
  })

  const data = result.data as FalPayload
  if (data?.detail === 'Not Found' || data?.error) {
    throw new Error(`FAL error for ${modelId}: ${data.error ?? data.detail}`)
  }
  return data as T
}

/** Upload an image/mask to FAL storage and get a URL. */
export async function uploadToFal(
  data: Blob | File | Buffer | string,
): Promise<string> {
  let file: Blob
  if (typeof data === 'string') {
    const base64 = data.includes(',') ? data.split(',')[1]! : data
    const mime   = data.startsWith('data:') ? data.split(';')[0]!.split(':')[1]! : 'image/png'
    const bytes  = Buffer.from(base64, 'base64')
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
