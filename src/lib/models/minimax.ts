import { runFal, extractVideoUrl, fal } from '@/lib/fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const FAL_MODEL = 'fal-ai/minimax-video'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const falInput: Record<string, unknown> = {
    prompt: input.prompt,
  }
  if (input.negativePrompt) falInput.negative_prompt = input.negativePrompt
  if (input.startFrameUrl)  falInput.first_frame_image = input.startFrameUrl

  const data = await runFal(FAL_MODEL, falInput)
  const videoUrl = extractVideoUrl(data)
  const jobId    = `minimax_${Date.now()}`

  return {
    jobId,
    status:  videoUrl ? 'complete' : 'failed',
    videoUrl,
    error:   videoUrl ? undefined : 'Minimax returned no video',
  }
}

export async function pollStatus(requestId: string): Promise<GenerateVideoOutput> {
  try {
    const status = await fal.queue.status(FAL_MODEL, { requestId, logs: false }) as { status: string }
    if (status.status !== 'COMPLETED') {
      if (status.status === 'FAILED') {
        return { jobId: requestId, status: 'failed', error: 'Minimax generation failed' }
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
