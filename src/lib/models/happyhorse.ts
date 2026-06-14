import { fal } from '../fal/client'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const ENDPOINT = 'alibaba/happy-horse/text-to-video'

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  try {
    const result = await fal.subscribe(ENDPOINT, {
      input: {
        prompt: input.prompt,
        aspect_ratio: input.aspectRatio,
        duration: Math.min(input.duration, 10),
        ...(input.startFrameUrl && { image_url: input.startFrameUrl }),
      },
      pollInterval: 3000,
    }) as { video?: { url: string } }
    const videoUrl = result.video?.url
    if (!videoUrl) throw new Error('HappyHorse returned no video URL')
    return { jobId: `fal-${Date.now()}`, status: 'complete', videoUrl }
  } catch (err) {
    return {
      jobId: `fal-${Date.now()}`,
      status: 'failed',
      error: err instanceof Error ? err.message : 'HappyHorse generation failed',
    }
  }
}

export async function pollStatus(externalJobId: string): Promise<GenerateVideoOutput> {
  return { jobId: externalJobId, status: 'complete' }
}
