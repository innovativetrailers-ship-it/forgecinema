import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { isR2PublicUrl } from '@/lib/media/clipPlayback'
import { getSignedDownloadUrl, keyFromUrl, objectExists } from '@/lib/storage/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

async function resolveUpstreamUrl(
  clipId: string,
  videoUrl: string | null,
  rawVideoUrl: string | null,
): Promise<string | null> {
  const candidates = [videoUrl, rawVideoUrl].filter((u): u is string => Boolean(u?.trim()))
  for (const url of candidates) {
    if (url.startsWith('/api/')) continue
    if (isR2PublicUrl(url) && (await objectExists(keyFromUrl(url)))) {
      try {
        return await getSignedDownloadUrl(keyFromUrl(url), 3600)
      } catch {
        return url
      }
    }
    if (!isR2PublicUrl(url)) return url
  }
  return candidates[0] ?? null
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<unknown> },
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { id } = (await context.params) as { id: string }
  const clip = await db.studioClip.findUnique({
    where: { id },
    include: { scene: { include: { project: { select: { userId: true } } } } },
  })

  if (!clip || clip.scene.project.userId !== userId) {
    return new Response('Not found', { status: 404 })
  }

  const upstreamUrl = await resolveUpstreamUrl(clip.id, clip.videoUrl, clip.rawVideoUrl)
  if (!upstreamUrl) {
    return new Response('No video', { status: 404 })
  }

  const range = request.headers.get('range')
  const upstreamHeaders: HeadersInit = { Accept: 'video/*,*/*' }
  if (range) upstreamHeaders.Range = range

  const upstream = await fetch(upstreamUrl, {
    headers: upstreamHeaders,
    signal: AbortSignal.timeout(120_000),
  })

  if (!upstream.ok && upstream.status !== 206) {
    return new Response(`Upstream ${upstream.status}`, { status: upstream.status === 404 ? 404 : 502 })
  }

  const headers = new Headers()
  headers.set('Content-Type', upstream.headers.get('content-type') ?? 'video/mp4')
  headers.set('Accept-Ranges', 'bytes')
  headers.set('Cache-Control', 'private, max-age=3600')

  for (const name of ['content-range', 'content-length'] as const) {
    const value = upstream.headers.get(name)
    if (value) headers.set(name, value)
  }

  return new Response(upstream.body, { status: upstream.status, headers })
}
