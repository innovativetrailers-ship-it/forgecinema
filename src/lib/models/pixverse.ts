import { fal } from '../fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const endpoint = input.startFrameUrl ? 'fal-ai/pixverse/v3/image-to-video' : 'fal-ai/pixverse/v3/text-to-video'

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
      error: err instanceof Error ? err.message : 'Pixverse generation failed',
    }
  }
}

export async function pollStatus(
  externalJobId: string
): Promise<GenerateVideoOutput> {
  return { jobId: externalJobId, status: 'processing' }
}
