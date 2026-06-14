import { generateImage } from '@/lib/engines/imageGen'
import type { StructuredShot, PatientZeroAssets } from './types'

/** One reference still per unique location — pins palette + lighting for the scene. */
export async function buildSceneStyleAnchors(
  shots: StructuredShot[],
  assets: PatientZeroAssets,
): Promise<Map<string, string>> {
  const anchors = new Map<string, string>()

  const locationNames = [...new Set(shots.flatMap((s) => s.locationsPresent).filter(Boolean))]
  await Promise.all(
    locationNames.map(async (name) => {
      const loc = assets.locations.find((l) => l.name === name)
      if (loc?.imageUrl) {
        anchors.set(name, loc.imageUrl)
        return
      }
      const shot = shots.find((s) => s.locationsPresent.includes(name))
      const desc = shot?.visualPrompt ?? name
      try {
        const [url] = await generateImage(
          `Cinematic location plate: ${name}. ${desc}. Establishing colour palette and lighting.`,
          { quality: 'reference', aspectRatio: '16:9' },
        )
        if (url) anchors.set(name, url)
      } catch { /* non-fatal */ }
    }),
  )

  return anchors
}

export function injectStyleAnchor(
  shot: StructuredShot,
  anchors: Map<string, string>,
): string | undefined {
  const loc = shot.locationsPresent[0]
  return loc ? anchors.get(loc) : undefined
}
