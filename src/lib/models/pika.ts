import { fal } from '../fal/client'
import { buildFalVideoInput } from '@/lib/fal/videoPayloads'
import { resolvePikaEndpoint } from '@/lib/fal/pikaEndpoints'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const isI2V = Boolean(input.startFrameUrl)
  const model = resolvePikaEndpoint(isI2V)

  const falInput = await buildFalVideoInput(model, 'pika-2.5', {
    prompt: input.prompt,
    duration: input.duration ?? 5,
    aspectRatio: input.aspectRatio ?? '16:9',
    imageUrl: input.startFrameUrl,
    negativePrompt: input.negativePrompt,
    quality: input.quality,
  })
  if (input.seed !== undefined) falInput.seed = input.seed

  try {
    const result = await fal.subscribe(model, {
      input: falInput,
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
  return { jobId: externalJobId, status: 'processing' }
}
