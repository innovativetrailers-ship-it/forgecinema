import { fal } from '../fal/client'

export interface LTXPayload {
  prompt: string
  negativePrompt?: string
  duration: number
  aspectRatio?: string
  seed?: number
}

export async function generateLTX(payload: LTXPayload): Promise<string> {
  const result = await fal.subscribe('fal-ai/ltx-video-2-distilled', {
    input: {
      prompt: payload.prompt,
      negative_prompt: payload.negativePrompt,
      num_frames: Math.round(payload.duration * 25),
      ...(payload.seed !== undefined && { seed: payload.seed }),
    },
    pollInterval: 1000,
  }) as unknown as { video: { url: string } }
  return result.video.url
}
