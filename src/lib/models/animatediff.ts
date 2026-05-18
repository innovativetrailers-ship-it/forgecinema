import { fal } from '../fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  interface FalResult {
    request_id: string
  }

  const result = await fal.queue.submit('fal-ai/animatediff-v2v', {
    input: {
      prompt: input.prompt,
      ...(input.negativePrompt && { negative_prompt: input.negativePrompt }),
      ...(input.startFrameUrl && { video_url: input.startFrameUrl }),
      num_frames: Math.round(input.duration * 8),
      motion_bucket_id: Math.round((input.motionStrength ?? 0.5) * 127),
      fps: 8,
      ...(input.seed !== undefined && { seed: input.seed }),
    },
  }) as FalResult

  return { jobId: result.request_id, status: 'pending' }
}

export async function pollStatus(
  externalJobId: string
): Promise<GenerateVideoOutput> {
  interface FalQueueStatus {
    status: string
  }

  const status = await fal.queue.status('fal-ai/animatediff-v2v', {
    requestId: externalJobId,
    logs: false,
  }) as FalQueueStatus

  if (status.status === 'COMPLETED') {
    interface FalResult {
      video?: { url: string }
    }
    const result = await fal.queue.result('fal-ai/animatediff-v2v', {
      requestId: externalJobId,
    }) as FalResult

    return { jobId: externalJobId, status: 'complete', videoUrl: result.video?.url }
  }

  if (status.status === 'FAILED') {
    return { jobId: externalJobId, status: 'failed', error: 'AnimateDiff generation failed' }
  }

  return { jobId: externalJobId, status: 'processing' }
}
