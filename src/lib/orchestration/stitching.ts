// src/lib/orchestration/stitching.ts
// Phase 6: concatenate segments into the final film + RIFE boundary interpolation

import { uploadToR2 }        from '@/lib/storage/r2'
import type { GeneratedSegment } from './types'

const FAL_KEY = () => process.env.FAL_API_KEY!

export async function stitchSegments(
  segments: GeneratedSegment[],
  userId:   string
): Promise<string> {
  const ordered   = [...segments].sort((a, b) => a.shotIndex - b.shotIndex)
  const videoUrls = ordered.map(s => s.videoUrl)

  // RIFE interpolation at each boundary for smooth cross-model transitions
  const transitions: string[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    try {
      const trans = await fetch('https://fal.run/fal-ai/rife-interpolation', {
        method:  'POST',
        headers: { Authorization: `Key ${FAL_KEY()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: {
            video_a: ordered[i].videoUrl,
            video_b: ordered[i + 1].videoUrl,
            frames:  4,
            mode:    'boundary',
          },
        }),
      }).then(r => r.json())
      if (trans.video?.url) transitions[i] = trans.video.url
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[stitching] RIFE skipped for boundary ${i}:`, msg)
    }
  }

  // Interleave segments and transition clips
  const concatList: string[] = []
  for (let i = 0; i < videoUrls.length; i++) {
    concatList.push(videoUrls[i])
    if (transitions[i]) concatList.push(transitions[i])
  }

  // FFmpeg concatenation via fal
  const result = await fetch('https://fal.run/fal-ai/ffmpeg', {
    method:  'POST',
    headers: { Authorization: `Key ${FAL_KEY()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        command:       'concat',
        video_urls:    concatList,
        output_format: 'mp4',
        resolution:    '1080p',
        fps:           24,
      },
    }),
  }).then(r => r.json())

  const stitchedUrl = result.video?.url ?? result.output_url
  if (!stitchedUrl) {
    console.error('[stitching] FFmpeg concat failed, returning first segment')
    return videoUrls[0]
  }

  // Upload to R2 for permanent storage
  const buf      = await fetch(stitchedUrl).then(r => r.arrayBuffer())
  const finalUrl = await uploadToR2(
    Buffer.from(buf),
    `films/${userId}/${Date.now()}_final.mp4`,
    'video/mp4'
  )

  return finalUrl
}
