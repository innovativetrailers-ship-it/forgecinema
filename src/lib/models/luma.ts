import { runFal, extractVideoUrl, fal } from '@/lib/fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const FAL_MODEL = 'fal-ai/luma-dream-machine'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const falInput: Record<string, unknown> = {
    prompt:       input.prompt,
    aspect_ratio: input.aspectRatio ?? '16:9',
    duration:     input.duration,
  }
  if (input.startFrameUrl) {
    falInput.keyframes = { frame0: { type: 'image', url: input.startFrameUrl } }
  }
  if (input.endFrameUrl) {
    falInput.keyframes = {
      ...(falInput.keyframes as object),
      frame1: { type: 'image', url: input.endFrameUrl },
    }
  }

  const data = await runFal(FAL_MODEL, falInput)
  const videoUrl = extractVideoUrl(data)
  const jobId    = `luma_${Date.now()}`

  return {
    jobId,
    status:  videoUrl ? 'complete' : 'failed',
    videoUrl,
    error:   videoUrl ? undefined : 'Luma returned no video',
  }
}

export async function pollStatus(requestId: string): Promise<GenerateVideoOutput> {
  try {
    const status = await fal.queue.status(FAL_MODEL, { requestId, logs: false }) as { status: string }
    if (status.status !== 'COMPLETED') {
      if (status.status === 'FAILED') {
        return { jobId: requestId, status: 'failed', error: 'Luma generation failed' }
      }
      return { jobId: requestId, status: 'processing' }
    }
    const result = await fal.queue.result(FAL_MODEL, { requestId }) as { data: unknown }
    const videoUrl = extractVideoUrl(result.data)
    return { jobId: requestId, status: 'complete', videoUrl }
  } catch {
    return { jobId: requestId, status: 'processing' }
  }
}
