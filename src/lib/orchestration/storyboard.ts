// src/lib/orchestration/storyboard.ts
// Phase 1.5: generate a Frame-Zero keyframe still for each shot
// Conditioned on Patient Zero character + location references

import { runFal, extractImageUrl } from '@/lib/fal/client'
import { uploadToR2 } from '@/lib/storage/r2'
import type { StructuredShot, PatientZeroAssets } from './types'

async function generateKeyframe(
  shot:   StructuredShot,
  assets: PatientZeroAssets
): Promise<string> {
  // Pull the relevant character + location references for this shot
  const charRef = shot.charactersPresent
    .map(name => assets.characters.find(c => c.name === name)?.imageUrl)
    .filter(Boolean)[0]
  const locRef = shot.locationsPresent
    .map(name => assets.locations.find(l => l.name === name)?.imageUrl)
    .filter(Boolean)[0]

  // Build the keyframe prompt — the EXACT opening composition of this shot
  const prompt = `Cinematic storyboard keyframe, opening composition of this shot.
${shot.visualPrompt}
Camera: ${shot.cameraMove}. Lighting: ${shot.lighting}. Mood: ${shot.mood}.
Film still, photorealistic, composed exactly as the first frame of the shot.`

  const input: Record<string, unknown> = { prompt }
  // Decoupled reference conditioning — character identity locked via its own input lane
  if (charRef) input.image_url           = charRef    // primary reference
  if (locRef)  input.reference_image_url = locRef     // location plate

  const res = await runFal('fal-ai/gemini-pro-image', input)
  const rawUrl = extractImageUrl(res)
  if (!rawUrl) throw new Error('storyboard keyframe returned no image')
  const buf = await fetch(rawUrl).then(r => r.arrayBuffer())
  return uploadToR2(Buffer.from(buf), `storyboard/${shot.shotIndex}_${Date.now()}.jpg`, 'image/jpeg')
}

// Generate keyframes for ALL shots in parallel
export async function generateStoryboard(
  shots:  StructuredShot[],
  assets: PatientZeroAssets,
  onProgress?: (done: number, total: number) => void
): Promise<StructuredShot[]> {
  let done = 0
  const withKeyframes = await Promise.all(
    shots.map(async shot => {
      try {
        const storyboardUrl = await generateKeyframe(shot, assets)
        done++
        onProgress?.(done, shots.length)
        return { ...shot, storyboardUrl }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        console.warn(`[storyboard] keyframe failed for shot ${shot.shotIndex}:`, msg)
        done++
        onProgress?.(done, shots.length)
        return shot   // proceed without keyframe — falls back to T2V
      }
    })
  )
  return withKeyframes
}
