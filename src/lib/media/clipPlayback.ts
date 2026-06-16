import { isEphemeralVideoUrl } from '@/lib/media/ephemeralUrls'

export function clipMediaPath(clipId: string): string {
  return `/api/media/${clipId}`
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

/** Browser-safe playback URL — R2 direct or same-origin proxy. */
export function publicPlaybackUrlForClip(
  clipId: string,
  videoUrl: string | null | undefined,
  rawVideoUrl?: string | null,
): string | undefined {
  const stored = videoUrl?.trim()
  if (!stored) return undefined
  if (stored.startsWith('/api/')) return stored
  if (isR2PublicUrl(stored) && !needsMediaProxy(stored)) return stored
  if (needsMediaProxy(stored) || (rawVideoUrl && needsMediaProxy(rawVideoUrl))) {
    return clipMediaPath(clipId)
  }
  return stored
}

/** Client reconcile helper when shot card already has resolved videoUrl. */
export function shotPlaybackUrl(shotId: string, videoUrl: string | undefined): string {
  const raw = videoUrl?.trim() ?? ''
  if (!raw) return ''
  if (raw.startsWith('/')) return raw
  if (isR2PublicUrl(raw) && !needsMediaProxy(raw)) return raw
  if (needsMediaProxy(raw)) return clipMediaPath(shotId)
  return raw
}
