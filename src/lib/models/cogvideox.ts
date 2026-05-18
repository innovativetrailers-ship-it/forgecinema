import { fal } from '../fal/client'

export interface CogVideoXPayload {
  prompt: string
  negativePrompt?: string
  duration: number
  seed?: number
}

export async function generateCogVideoX(payload: CogVideoXPayload): Promise<string> {
  const result = await fal.subscribe('fal-ai/cogvideox-5b', {
    input: {
      prompt: payload.prompt,
      negative_prompt: payload.negativePrompt,
      ...(payload.seed !== undefined && { seed: payload.seed }),
    },
    pollInterval: 4000,
  }) as unknown as { video: { url: string } }
  return result.video.url
}
