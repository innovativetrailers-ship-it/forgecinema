// Phase 6: concatenate segments into the final film + RIFE boundary interpolation

import { runFal, extractVideoUrl } from '@/lib/fal/client'
import { stripGeneratedClipAudio } from '@/lib/fal/stripVideoAudio'
import { uploadToR2 }        from '@/lib/storage/r2'
import type { GeneratedSegment } from './types'

export async function stitchSegments(
  segments: GeneratedSegment[],
  userId:   string
): Promise<string> {
  const ordered   = [...segments].sort((a, b) => a.shotIndex - b.shotIndex)
  const videoUrls = ordered.map(s => s.videoUrl)

  const transitions: string[] = []
  for (let i = 0; i < ordered.length - 1; i++) {
    try {
      const trans = await runFal<{ video?: { url: string } }>('fal-ai/rife-interpolation', {
        video_a: ordered[i].videoUrl,
        video_b: ordered[i + 1].videoUrl,
        frames:  4,
        mode:    'boundary',
      })
      const url = extractVideoUrl(trans)
      if (url) transitions[i] = url
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[stitching] RIFE skipped for boundary ${i}:`, msg)
    }
  }

  const concatList: string[] = []
  for (let i = 0; i < videoUrls.length; i++) {
    concatList.push(videoUrls[i])
    if (transitions[i]) concatList.push(transitions[i])
  }

  const silentClips: string[] = []
  for (const url of concatList) {
    silentClips.push(await stripGeneratedClipAudio(url))
  }

  const result = await runFal<{ video?: { url: string }; output_url?: string }>('fal-ai/ffmpeg', {
    command:       'concat',
    video_urls:    silentClips,
    output_format: 'mp4',
    resolution:    '1080p',
    fps:           24,
    include_audio: false,
  })

  const stitchedUrl = extractVideoUrl(result) ?? result.output_url
  if (!stitchedUrl) {
    console.error('[stitching] FFmpeg concat failed, returning first segment')
    return videoUrls[0]
  }

  const buf      = await fetch(stitchedUrl).then(r => r.arrayBuffer())
  const finalUrl = await uploadToR2(
    Buffer.from(buf),
    `films/${userId}/${Date.now()}_final.mp4`,
    'video/mp4'
  )

  return finalUrl
}
