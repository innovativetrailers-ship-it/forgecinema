import { db } from '@/lib/db'
import { isEphemeralVideoUrl } from '@/lib/media/ephemeralUrls'
import {
  uploadToR2,
  objectExists,
  renderVideoKey,
  publicUrlForKey,
  getSignedDownloadUrl,
} from './r2'

/** Mirror provider CDN URLs (fal, etc.) to R2 so playback/download survives link expiry. */
export async function persistVideoToR2(
  sourceUrl: string,
  jobId: string,
  userId: string,
): Promise<string> {
  const publicBase = process.env.R2_PUBLIC_URL?.replace(/\/$/, '')
  if (publicBase && sourceUrl.startsWith(publicBase)) return sourceUrl

  const res = await fetch(sourceUrl, {
    signal: AbortSignal.timeout(120_000),
    headers: { Accept: 'video/*,*/*' },
  })
  if (!res.ok) {
    throw new Error(`Failed to download generated video (${res.status})`)
  }

  const buffer = Buffer.from(await res.arrayBuffer())
  if (buffer.length < 1024) {
    throw new Error('Downloaded video file is too small — provider may have returned an error page')
  }

  return uploadToR2(buffer, renderVideoKey(userId, jobId), 'video/mp4')
}

/**
 * Resolve a durable playback URL for a completed job.
 * Prefers R2 mirror; attempts one-time persist from ephemeral provider URLs.
 */
export async function resolveJobPlaybackUrl(
  jobId: string,
  userId: string,
  storedOutputUrl: string | null | undefined,
): Promise<string | null> {
  const key = renderVideoKey(userId, jobId)

  if (await objectExists(key)) {
    const publicUrl = publicUrlForKey(key)
    if (storedOutputUrl !== publicUrl) {
      await db.renderJob.update({
        where: { id: jobId },
        data: { outputUrl: publicUrl },
      }).catch(() => {})
    }
    return publicUrl
  }

  if (storedOutputUrl && !isEphemeralVideoUrl(storedOutputUrl)) {
    return storedOutputUrl
  }

  if (storedOutputUrl && isEphemeralVideoUrl(storedOutputUrl)) {
    try {
      const persisted = await persistVideoToR2(storedOutputUrl, jobId, userId)
      await db.renderJob.update({
        where: { id: jobId },
        data: { outputUrl: persisted },
      }).catch(() => {})
      return persisted
    } catch {
      return null
    }
  }

  return null
}

/** Signed URL for playback when the bucket is private; falls back to public URL. */
export async function signedPlaybackUrl(
  jobId: string,
  userId: string,
  storedOutputUrl: string | null | undefined,
): Promise<string | null> {
  const resolved = await resolveJobPlaybackUrl(jobId, userId, storedOutputUrl)
  if (!resolved) return null

  const key = renderVideoKey(userId, jobId)
  if (await objectExists(key)) {
    try {
      return await getSignedDownloadUrl(key, 3600)
    } catch {
      return resolved
    }
  }

  return resolved
}
