import { fal } from '../fal/client'

export interface SkyReelsPayload {
  prompt: string
  negativePrompt?: string
  duration: number
  aspectRatio: string
  characterRefs?: string[]
  seed?: number
}

export async function generateSkyReels(payload: SkyReelsPayload): Promise<string> {
  const result = await fal.subscribe('fal-ai/skyreels-v1', {
    input: {
      prompt: payload.prompt,
      negative_prompt: payload.negativePrompt,
      num_frames: Math.round(payload.duration * 25),
      aspect_ratio: payload.aspectRatio,
      image_references: payload.characterRefs?.slice(0, 3),
      ...(payload.seed !== undefined && { seed: payload.seed }),
    },
    pollInterval: 3000,
  }) as unknown as { video: { url: string } }
  return result.video.url
}
