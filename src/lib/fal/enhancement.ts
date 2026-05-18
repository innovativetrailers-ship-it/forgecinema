import { fal } from './client'

async function upscaleRaw(
  imageUrl: string,
  scale: 2 | 4 = 4,
  model: 'aura' | 'esrgan' | 'clarity' | 'codeformer' = 'aura'
): Promise<string> {
  interface UpscaleResult {
    image?: { url: string }
    images?: Array<{ url: string }>
  }

  const modelMap: Record<string, string> = {
    aura: 'fal-ai/aura-sr',
    esrgan: 'fal-ai/real-esrgan',
    clarity: 'fal-ai/clarity-upscaler',
    codeformer: 'fal-ai/codeformer',
  }

  const result = await fal.run(modelMap[model] ?? modelMap.aura, {
    input: {
      image_url: imageUrl,
      ...(model === 'aura' && { upscaling_factor: scale }),
      ...(model === 'esrgan' && { scale }),
      ...(model === 'clarity' && { scale }),
    },
  }) as UpscaleResult

  return result.image?.url ?? result.images?.[0]?.url ?? imageUrl
}

async function removeBackgroundRaw(imageUrl: string): Promise<string> {
  interface RembgResult {
    image?: { url: string }
  }

  const result = await fal.run('fal-ai/birefnet', {
    input: { image_url: imageUrl },
  }) as RembgResult

  return result.image?.url ?? imageUrl
}

export async function restoreFace(imageUrl: string): Promise<string> {
  interface CodeformerResult {
    image?: { url: string }
  }

  const result = await fal.run('fal-ai/codeformer', {
    input: { image_url: imageUrl, fidelity: 0.7 },
  }) as CodeformerResult

  return result.image?.url ?? imageUrl
}

export async function generateProxyFrame(prompt: string): Promise<string> {
  interface FluxResult {
    images?: Array<{ url: string }>
  }

  const result = await fal.run('fal-ai/flux/schnell', {
    input: {
      prompt,
      image_size: 'landscape_16_9' as const,
      num_inference_steps: 4,
    },
  }) as FluxResult

  return result.images?.[0]?.url ?? ''
}

// Typed public API — all functions return structured objects
export async function upscaleImage(
  imageUrl: string,
  model: 'aura-sr' | 'esrgan' | 'clarity' | 'codeformer' = 'aura-sr'
): Promise<{ upscaledUrl: string }> {
  const modelKey = (model === 'aura-sr' ? 'aura' : model) as 'aura' | 'esrgan' | 'clarity' | 'codeformer'
  const upscaledUrl = await upscaleRaw(imageUrl, 4, modelKey)
  return { upscaledUrl }
}

export async function removeBackground(imageUrl: string): Promise<{ maskedUrl: string }> {
  const maskedUrl = await removeBackgroundRaw(imageUrl)
  return { maskedUrl }
}

export async function extractDepthMap(imageUrl: string): Promise<{ depthUrl: string }> {
  interface DepthResult {
    image?: { url: string }
  }

  const result = await fal.run('fal-ai/depth-anything-v2', {
    input: { image_url: imageUrl },
  }) as DepthResult

  return { depthUrl: result.image?.url ?? imageUrl }
}

export async function upscale4x(imageUrl: string): Promise<{ upscaledUrl: string }> {
  return upscaleImage(imageUrl, 'aura-sr')
}

export async function checkNSFWImage(imageUrl: string): Promise<{ safe: boolean; score: number }> {
  interface NSFWResult {
    has_nsfw_concept?: boolean[]
    safety_checker_result?: Array<{ is_nsfw: boolean; score: number }>
  }

  try {
    const result = await fal.run('fal-ai/nsfw-detector', {
      input: { image_url: imageUrl },
    }) as NSFWResult

    const isNsfw = result.has_nsfw_concept?.[0] ?? false
    const score = result.safety_checker_result?.[0]?.score ?? (isNsfw ? 0.9 : 0.05)
    return { safe: !isNsfw, score }
  } catch {
    return { safe: true, score: 0 }
  }
}
