import { isEphemeralVideoUrl } from '@/lib/media/ephemeralUrls'

export function clipMediaPath(clipId: string): string {
  return `/api/media/${clipId}`
}

/** Same-origin playback. A redirect to object storage needs bucket CORS; this route does not. */
export function playerStreamPath(id: string): string {
  return `/api/media/${encodeURIComponent(id)}/stream`
}

export function playerSrc(sourceUrl: string, mediaId?: string | null): string {
  const url = sourceUrl.trim()
  if (mediaId?.trim()) return playerStreamPath(mediaId.trim())
  const match = url.match(/^\/api\/media\/([^/?]+)/)
  if (match && match[1] !== 'bins' && !url.includes('/stream')) return playerStreamPath(match[1])
  if (url.includes('/stream')) return url
  return url
}

export function isR2PublicUrl(url: string): boolean {
  const base = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
  if (base && url.startsWith(base)) return true
  return /\.r2\.dev|cloudflarestorage\.com/i.test(url)
}

/** Third-party CDN URLs the browser cannot play cross-origin without a proxy. */
export function needsMediaProxy(url: string): boolean {
  if (!url?.trim() || url.startsWith('/')) return false
  if (isR2PublicUrl(url)) return false
  if (isEphemeralVideoUrl(url)) return true
  if (/xai-video|\.x\.ai|runway\.ml|replicate\.delivery/i.test(url)) return true
  return /^https?:\/\//i.test(url)
}

/** Browser-safe playback URL. Any non-origin provider URL goes through /api/media. */
export function publicPlaybackUrlForClip(
  clipId: string,
  videoUrl: string | null | undefined,
  rawVideoUrl?: string | null,
): string | undefined {
  const stored = videoUrl?.trim() || rawVideoUrl?.trim()
  if (!stored) return undefined
  if (stored.startsWith('/')) return stored
  return clipMediaPath(clipId)
}

/** Client reconcile helper when shot card already has resolved videoUrl. */
export function shotPlaybackUrl(shotId: string, videoUrl: string | undefined): string {
  const raw = videoUrl?.trim() ?? ''
  if (!raw) return ''
  if (raw.startsWith('/')) return raw
  return clipMediaPath(shotId)
}
