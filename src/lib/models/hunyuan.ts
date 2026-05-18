import { fal } from '../fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const model = input.startFrameUrl ? 'fal-ai/wan-i2v' : 'fal-ai/hunyuan-video'

  interface FalResult {
    request_id: string
    status?: string
  }

  const result = await fal.queue.submit(model, {
    input: {
      prompt: input.prompt,
      ...(input.negativePrompt && { negative_prompt: input.negativePrompt }),
      ...(input.startFrameUrl && { image_url: input.startFrameUrl }),
      num_frames: Math.round(input.duration * 16),
      ...(input.seed !== undefined && { seed: input.seed }),
    },
  }) as FalResult

  return { jobId: result.request_id, status: 'pending' }
}

export async function pollStatus(
  externalJobId: string,
  model: 'fal-ai/hunyuan-video' | 'fal-ai/wan-i2v' = 'fal-ai/hunyuan-video'
): Promise<GenerateVideoOutput> {
  interface FalQueueStatus {
    status: string
  }

  const status = await fal.queue.status(model, {
    requestId: externalJobId,
    logs: false,
  }) as FalQueueStatus

  if (status.status === 'COMPLETED') {
    interface FalQueueResult {
      video?: { url: string }
    }
    const result = await fal.queue.result(model, {
      requestId: externalJobId,
    }) as FalQueueResult

    return {
      jobId: externalJobId,
      status: 'complete',
      videoUrl: result.video?.url,
    }
  }

  if (status.status === 'FAILED') {
    return { jobId: externalJobId, status: 'failed', error: 'HunyuanVideo generation failed' }
  }

  return { jobId: externalJobId, status: 'processing' }
}
