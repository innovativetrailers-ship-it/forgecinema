import { runFal, extractImageUrl } from '@/lib/fal/client'
import { uploadToR2 } from '@/lib/storage/r2'

export interface NanoBananaParams {
  prompt:             string
  referenceImageUrl?: string
  style?:             'photorealistic' | 'cinematic' | 'illustrated' | 'stylised'
  quality?:           'standard' | 'pro'
}

export async function generateWithNanoBanana(
  params: NanoBananaParams
): Promise<{ imageUrl: string }> {
  const modelId = params.quality === 'pro'
    ? 'fal-ai/gemini-pro-image'
    : 'fal-ai/gemini-flash-image'

  const stylePrefix: Record<string, string> = {
    photorealistic: 'Professional photorealistic photograph: ',
    cinematic:      'Cinematic film still, shot on ARRI Alexa: ',
    illustrated:    'Detailed concept art illustration: ',
    stylised:       'Stylised artistic render: ',
  }

  const input: Record<string, unknown> = {
    prompt: `${stylePrefix[params.style ?? 'cinematic']}${params.prompt}`,
  }
  if (params.referenceImageUrl) input.image_url = params.referenceImageUrl

  const result = await runFal(modelId, input)
  const rawUrl = extractImageUrl(result)
  if (!rawUrl) throw new Error('Nano Banana: no image returned from FAL')

  const imageBuffer = await fetch(rawUrl).then(r => r.arrayBuffer())
  const imageUrl    = await uploadToR2(
    Buffer.from(imageBuffer),
    `generated/${Date.now()}.jpg`,
    'image/jpeg'
  )

  return { imageUrl }
}
