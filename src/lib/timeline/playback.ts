import type { Track } from './schema'

/** True when URL looks like streamable video (not a still frame). */
export function isVideoMediaUrl(url: string): boolean {
  if (!url.trim()) return false
  if (url.startsWith('/api/media/') || url.startsWith('/api/jobs/')) return true
  const path = url.split('?')[0]?.toLowerCase() ?? ''
  if (/\.(jpe?g|png|gif|webp|bmp|svg)$/.test(path)) return false
  if (/\.(mp4|webm|mov|m4v|ogv|ogg)$/.test(path)) return true
  if (path.includes('/playback') || path.includes('/video')) return true
  return !/\.(jpe?g|png|gif|webp|bmp|svg)$/.test(path)
}

/** Guard <video> play — same-origin paths or http(s) URLs only. */
export function canPlaySrc(src?: string): boolean {
  if (!src?.trim()) return false
  if (src.startsWith('/')) return true
  return /^https?:\/\//i.test(src)
}

/** Clamp clip duration — real shots are seconds, not hours. */
export function sanitizeClipDuration(raw: number, fallback = 5): number {
  if (!Number.isFinite(raw) || raw <= 0) return fallback
  if (raw > 600) {
    console.warn('clip_duration_suspect', { raw, fallback })
    return fallback
  }
  return raw
}

export function computeTimelineDuration(tracks: Track[], floorSeconds = 5): number {
  let maxEnd = 0
  for (const track of tracks) {
    for (const clip of track.clips) {
      const end = clip.endTime - clip.startTime
      if (end > 600) {
        console.warn('clip_duration_suspect', { clipId: clip.id, end })
      }
      if (clip.endTime > maxEnd) maxEnd = clip.endTime
    }
  }
  return Math.max(floorSeconds, Math.ceil(maxEnd * 10) / 10)
}

export function clipPosterUrl(clip: {
  posterUrl?: string
  metadata?: Record<string, unknown>
}): string | undefined {
  if (clip.posterUrl) return clip.posterUrl
  const meta = clip.metadata?.posterUrl
  return typeof meta === 'string' ? meta : undefined
}
