// Phase 1.5: Frame-Zero keyframe stills — checkpointed, individually retried, timeout-bounded

import { generateImage, imageModelForQuality, IMAGE_FAL_TIMEOUT_MS } from '@/lib/engines/imageGen'
import { uploadToR2 } from '@/lib/storage/r2'
import { loadKeyframeCheckpoint, saveKeyframeCheckpoint } from './checkpoints'
import type { StructuredShot, PatientZeroAssets } from './types'

const KEYFRAME_MAX_ATTEMPTS = 2

export interface StoryboardOptions {
  jobId?:      string
  onProgress?: (done: number, total: number, detail?: string) => void
  onPoll?:     () => void | Promise<void>
}

function buildKeyframePrompt(shot: StructuredShot): string {
  return `Cinematic storyboard keyframe, opening composition of this shot.
${shot.visualPrompt}
Camera: ${shot.cameraMove}. Lighting: ${shot.lighting}. Mood: ${shot.mood}.
Film still, photorealistic, composed exactly as the first frame of the shot.`
}

async function generateSingleKeyframe(
  shot:    StructuredShot,
  assets:  PatientZeroAssets,
  options: StoryboardOptions,
): Promise<StructuredShot> {
  const { jobId, onPoll } = options

  if (jobId) {
    const cached = await loadKeyframeCheckpoint(jobId, shot.shotIndex)
    if (cached) return { ...shot, storyboardUrl: cached }
  }

  const charRef = shot.charactersPresent
    .map((name) => assets.characters.find((c) => c.name === name)?.imageUrl)
    .filter(Boolean)[0]
  const locRef = shot.locationsPresent
    .map((name) => assets.locations.find((l) => l.name === name)?.imageUrl)
    .filter(Boolean)[0]

  const prompt = buildKeyframePrompt(shot)
  let lastErr: unknown

  for (let attempt = 1; attempt <= KEYFRAME_MAX_ATTEMPTS; attempt++) {
    try {
      const [rawUrl] = await generateImage(prompt, {
        quality:     'reference',
        aspectRatio: '16:9',
        refImageUrl: charRef ?? locRef,
        onPoll,
        timeoutMs:   IMAGE_FAL_TIMEOUT_MS,
      })
      if (!rawUrl) throw new Error('storyboard keyframe returned no image')

      const buf = await fetch(rawUrl).then((r) => r.arrayBuffer())
      const storyboardUrl = await uploadToR2(
        Buffer.from(buf),
        `storyboard/${shot.shotIndex}_${Date.now()}.jpg`,
        'image/jpeg',
      )

      if (jobId) await saveKeyframeCheckpoint(jobId, shot.shotIndex, storyboardUrl)
      return { ...shot, storyboardUrl }
    } catch (err) {
      lastErr = err
      if (attempt < KEYFRAME_MAX_ATTEMPTS) {
        console.warn(
          `[storyboard] shot ${shot.shotIndex} attempt ${attempt} failed (${imageModelForQuality('reference')}):`,
          err instanceof Error ? err.message : err,
        )
      }
    }
  }

  throw lastErr instanceof Error
    ? lastErr
    : new Error(`Keyframe ${shot.shotIndex + 1} failed after ${KEYFRAME_MAX_ATTEMPTS} attempts`)
}

export async function generateStoryboard(
  shots:   StructuredShot[],
  assets:  PatientZeroAssets,
  options: StoryboardOptions | ((done: number, total: number) => void) = {},
): Promise<StructuredShot[]> {
  const opts: StoryboardOptions = typeof options === 'function'
    ? { onProgress: options }
    : options

  const total = shots.length
  let done = 0

  const results = await Promise.allSettled(
    shots.map(async (shot) => {
      const result = await generateSingleKeyframe(shot, assets, opts)
      done++
      opts.onProgress?.(done, total, `Keyframe ${done}/${total}`)
      return result
    }),
  )

  const failed = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected')
  if (failed.length > 0) {
    const detail = failed
      .map((f) => (f.reason instanceof Error ? f.reason.message : String(f.reason)))
      .join('; ')
    throw new Error(`${failed.length} keyframe(s) failed after retries: ${detail}`)
  }

  return results.map((r) => (r as PromiseFulfilledResult<StructuredShot>).value)
}
