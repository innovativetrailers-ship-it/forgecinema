import { fal } from '../fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  if (!input.startFrameUrl) {
    throw new Error('SVD requires a start frame image')
  }

  interface FalResult {
    request_id: string
  }

  const result = await fal.queue.submit('fal-ai/stable-video-diffusion', {
    input: {
      image_url: input.startFrameUrl,
      motion_bucket_id: Math.round((input.motionStrength ?? 0.5) * 255),
      fps: 7,
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

  const status = await fal.queue.status('fal-ai/stable-video-diffusion', {
    requestId: externalJobId,
    logs: false,
  }) as FalQueueStatus

  if (status.status === 'COMPLETED') {
    interface FalQueueResult {
      video?: { url: string }
    }
    const result = await fal.queue.result('fal-ai/stable-video-diffusion', {
      requestId: externalJobId,
    }) as FalQueueResult

    return {
      jobId: externalJobId,
      status: 'complete',
      videoUrl: result.video?.url,
    }
  }

  if (status.status === 'FAILED') {
    return { jobId: externalJobId, status: 'failed', error: 'SVD generation failed' }
  }

  return { jobId: externalJobId, status: 'processing' }
}
