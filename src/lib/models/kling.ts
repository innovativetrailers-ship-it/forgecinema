// Kling routes through fal (fal-ai/kling-video) via the async queue API.
import { fal } from '../fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const T2V_PRO      = 'fal-ai/kling-video/v1.6/pro/text-to-video'
const T2V_STANDARD = 'fal-ai/kling-video/v1.6/standard/text-to-video'
const I2V_PRO      = 'fal-ai/kling-video/v1.6/pro/image-to-video'
const I2V_STANDARD = 'fal-ai/kling-video/v1.6/standard/image-to-video'

function endpointFor(tier: 'standard' | 'pro', isImageToVideo: boolean): string {
  if (isImageToVideo) return tier === 'pro' ? I2V_PRO : I2V_STANDARD
  return tier === 'pro' ? T2V_PRO : T2V_STANDARD
}

export async function generateVideo(
  input: GenerateVideoInput,
  tier: 'standard' | 'pro' = 'standard'
): Promise<GenerateVideoOutput> {
  const isI2V = Boolean(input.startFrameUrl)
  const model = endpointFor(tier, isI2V)

  const falInput: Record<string, unknown> = {
    prompt:       input.prompt,
    duration:     String(input.duration ?? 5),
    aspect_ratio: input.aspectRatio ?? '16:9',
  }
  if (input.negativePrompt)     falInput.negative_prompt = input.negativePrompt
  if (input.startFrameUrl)      falInput.image_url        = input.startFrameUrl
  if (input.seed !== undefined) falInput.seed             = input.seed

  // Async submit — returns immediately with a request id for the worker to poll.
  interface FalSubmit { request_id: string }
  const res = (await fal.queue.submit(model, { input: falInput })) as FalSubmit

  return { jobId: res.request_id, status: 'pending' }
}

export async function pollStatus(
  requestId: string,
  tier: 'standard' | 'pro' = 'standard',
  isImageToVideo = false
): Promise<GenerateVideoOutput> {
  const model = endpointFor(tier, isImageToVideo)

  interface FalStatus { status: string }
  const status = (await fal.queue.status(model, { requestId, logs: false })) as FalStatus

  if (status.status === 'COMPLETED') {
    interface FalResult {
      video?: { url?: string; cover_image_url?: string }
      video_url?: string
    }
    const result = (await fal.queue.result(model, { requestId })) as FalResult
    return {
      jobId:        requestId,
      status:       'complete',
      videoUrl:     result.video?.url ?? result.video_url,
      thumbnailUrl: result.video?.cover_image_url,
    }
  }

  if (status.status === 'FAILED') {
    return { jobId: requestId, status: 'failed', error: 'Kling generation failed' }
  }

  return { jobId: requestId, status: 'processing' }
}
