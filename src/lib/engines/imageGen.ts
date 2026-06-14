import { runFal, extractImageUrl, IMAGE_FAL_TIMEOUT_MS } from '@/lib/fal/client'

export { IMAGE_FAL_TIMEOUT_MS } from '@/lib/fal/client'

export type ImageQuality = 'reference' | 'production'

const MODEL_BY_QUALITY: Record<ImageQuality, string> = {
  reference:  'fal-ai/gemini-25-flash-image',
  production: 'fal-ai/gemini-3-pro-image-preview',
}

export async function generateImage(
  prompt: string,
  options?: {
    quality?:      ImageQuality
    aspectRatio?:  string
    numImages?:    number
    refImageUrl?:  string
    referenceImageUrl?: string
    onPoll?:       () => void | Promise<void>
    timeoutMs?:    number
  },
): Promise<string[]> {
  const quality     = options?.quality     ?? 'reference'
  const aspectRatio = options?.aspectRatio ?? '16:9'
  const numImages   = options?.numImages   ?? 1
  const refUrl      = options?.refImageUrl ?? options?.referenceImageUrl

  const input: Record<string, unknown> = {
    prompt,
    num_images:       numImages,
    aspect_ratio:     aspectRatio,
    output_format:    'png',
    safety_tolerance: '4',
  }
  if (refUrl) input.image_url = refUrl

  const result = await runFal(
    MODEL_BY_QUALITY[quality],
    input,
    undefined,
    options?.timeoutMs ?? IMAGE_FAL_TIMEOUT_MS,
    options?.onPoll,
  )
  const d = result as { images?: Array<{ url?: string }> }
  if (d.images?.length) {
    return d.images.map(i => i.url).filter((u): u is string => Boolean(u))
  }
  const single = extractImageUrl(result)
  return single ? [single] : []
}

export function imageModelForQuality(quality: ImageQuality): string {
  return MODEL_BY_QUALITY[quality]
}
