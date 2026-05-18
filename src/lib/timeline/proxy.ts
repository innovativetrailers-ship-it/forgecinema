import { generateProxyDraft } from '../fal/proxy'

export interface ProxyManifest {
  clipId: string
  duration: number
  frames: Array<{ timestamp: number; url: string }>
}

export async function generateClipProxy(params: {
  clipId: string
  sourceUrl: string
  prompt: string
  duration: number
  aspectRatio?: string
}): Promise<ProxyManifest> {
  const { clipId, prompt, duration, aspectRatio = '16:9' } = params

  // Generate 1 frame per second for proxy
  const numFrames = Math.min(Math.ceil(duration), 30)
  const frameTimestamps = Array.from({ length: numFrames }, (_, i) => i)

  // Generate proxy frames in parallel (batches of 5 to avoid rate limits)
  const frames: Array<{ timestamp: number; url: string }> = []

  for (let i = 0; i < frameTimestamps.length; i += 5) {
    const batch = frameTimestamps.slice(i, i + 5)
    const batchResults = await Promise.allSettled(
      batch.map(async (ts) => ({
        timestamp: ts,
        url: await generateProxyDraft(
          `${prompt}, frame ${ts}/${numFrames}`,
          aspectRatio
        ),
      }))
    )

    for (const result of batchResults) {
      if (result.status === 'fulfilled') {
        frames.push(result.value)
      }
    }
  }

  return { clipId, duration, frames }
}

export function getProxyFrameAtTime(
  manifest: ProxyManifest,
  timeSeconds: number
): string | null {
  if (manifest.frames.length === 0) return null

  const closest = manifest.frames.reduce((prev, curr) =>
    Math.abs(curr.timestamp - timeSeconds) < Math.abs(prev.timestamp - timeSeconds)
      ? curr
      : prev
  )

  return closest.url
}
