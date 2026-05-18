import { fal } from '../fal/client'

export interface ModerationResult {
  safe: boolean
  score: number
  categories: string[]
}

interface NSFWFalResult {
  nsfw_probability?: number
  is_safe?: boolean
  categories?: string[]
}

async function checkImage(imageUrl: string): Promise<ModerationResult> {
  const result = await fal.run('fal-ai/nsfw-detector', {
    input: { image_url: imageUrl },
  }) as NSFWFalResult

  const score = result.nsfw_probability ?? 0
  return {
    safe: score < 0.7,
    score,
    categories: result.categories ?? [],
  }
}

export async function checkNSFW(
  mediaUrl: string,
  type: 'image' | 'video' = 'image'
): Promise<ModerationResult> {
  if (!process.env.NSFW_CHECK_ENABLED || process.env.NSFW_CHECK_ENABLED === 'false') {
    return { safe: true, score: 0, categories: [] }
  }

  if (type === 'image') {
    return checkImage(mediaUrl)
  }

  // For video: extract frames every 2 seconds via fal.ai
  interface FrameResult {
    frames?: Array<{ url: string }>
  }

  try {
    const frames = await fal.run('fal-ai/video-frame-extractor', {
      input: { video_url: mediaUrl, fps: 0.5 },
    }) as FrameResult

    const frameUrls = frames.frames?.map((f) => f.url) ?? [mediaUrl]

    const results = await Promise.all(frameUrls.slice(0, 10).map(checkImage))

    const maxScore = Math.max(...results.map((r) => r.score))
    const allCategories = [...new Set(results.flatMap((r) => r.categories))]

    return {
      safe: maxScore < 0.7,
      score: maxScore,
      categories: allCategories,
    }
  } catch {
    // If frame extraction fails, check the first frame as image
    return checkImage(mediaUrl)
  }
}
