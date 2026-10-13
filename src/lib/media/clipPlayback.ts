import { isEphemeralVideoUrl } from '@/lib/media/ephemeralUrls'

export function clipMediaPath(clipId: string): string {
  return `/api/media/${clipId}`
}

/** Same-origin playback. A redirect to object storage needs bucket CORS; this route does not. */
export function playerStreamPath(id: string): string {
  return `/api/media/${encodeURIComponent(id)}/stream`
}

const API_MEDIA = /\/api\/media\/([^/?#]+)/
const OUR_BUCKET = /(?:\.r2\.cloudflarestorage\.com|\.r2\.dev)\b/i

/** Library or job id stored in an old redirect path or in an object-storage URL. */
export function mediaIdFromPlaybackUrl(url: string): string | null {
  const api = url.match(API_MEDIA)
  if (api && api[1] !== 'bins') return decodeURIComponent(api[1])
  if (!OUR_BUCKET.test(url)) return null
  let path = url
  try { path = new URL(url).pathname } catch { /* already a path */ }
  const file = path.split('/').filter(Boolean).pop() ?? ''
  const bare = decodeURIComponent(file).replace(/\.(mp4|webm|mov|m4v)$/i, '')
  return bare || null
}

export function playerSrc(sourceUrl: string, mediaId?: string | null): string {
  const url = sourceUrl.trim()
  const fromUrl = url ? mediaIdFromPlaybackUrl(url) : null
  const id = (mediaId?.trim() || fromUrl || '').replace(/\/stream$/, '')
  if (id && id !== 'bins') return playerStreamPath(id)
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
