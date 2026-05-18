import { fal } from '../fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const T2V_MODEL = 'fal-ai/wan/v2.2/t2v'
const I2V_MODEL = 'fal-ai/wan/v2.2/i2v'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const model = input.startFrameUrl ? I2V_MODEL : T2V_MODEL

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
  model: string = T2V_MODEL
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
    return { jobId: externalJobId, status: 'failed', error: 'Wan 2.2 generation failed' }
  }

  return { jobId: externalJobId, status: 'processing' }
}
