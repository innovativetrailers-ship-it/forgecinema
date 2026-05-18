import { fal } from '../fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const endpoint = 'fal-ai/pika'

  try {
    const result = await fal.subscribe(endpoint, {
      input: {
        prompt: input.prompt,
        ...(input.negativePrompt && { negative_prompt: input.negativePrompt }),
        ...(input.startFrameUrl && { image_url: input.startFrameUrl }),
        aspect_ratio: input.aspectRatio,
        duration: Math.min(input.duration, 10),
        ...(input.seed !== undefined && { seed: input.seed }),
      },
      pollInterval: 3000,
    }) as unknown as { video: { url: string } }

    return {
      jobId: 'fal-' + Date.now(),
      status: 'complete',
      videoUrl: result.video.url,
    }
  } catch (err) {
    return {
      jobId: 'fal-' + Date.now(),
      status: 'failed',
      error: err instanceof Error ? err.message : 'Pika generation failed',
    }
  }
}

export async function pollStatus(
  externalJobId: string
): Promise<GenerateVideoOutput> {
  // Since we use fal.subscribe which waits for completion,
  // this is mostly a fallback if we switched to async queues.
  return { jobId: externalJobId, status: 'processing' }
}
