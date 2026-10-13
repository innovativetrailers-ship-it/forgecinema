import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { requireUser } from '@/lib/auth/requireUser'
import { contentTypeForKey } from '@/lib/library/model'
import { mediaMissMessage, resolveOwnedMedia } from '@/lib/media/resolveStoredMedia'
import { readStoredObject } from '@/lib/storage/r2'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * Same-origin media for the program monitor.
 * Bytes travel through the function (Vercel egress plus object-storage egress).
 * Range requests limit that to the span the player asks for. The download route stays a redirect.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<unknown> },
) {
  const session = await auth()
  const userId = (await requireUser(request))?.id ?? session?.user?.id
  if (!userId) return new Response('Unauthorized', { status: 401 })

  const { id } = (await context.params) as { id: string }
  const resolved = await resolveOwnedMedia(id, userId)
  const range = request.headers.get('range')

  if (resolved.remoteUrl) {
    const upstream = await fetch(resolved.remoteUrl, {
      headers: range ? { Range: range } : {},
    })
    const headers = new Headers()
    for (const name of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
      const value = upstream.headers.get(name)
      if (value) headers.set(name, value)
    }
    if (!headers.has('accept-ranges')) headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'private, max-age=300')
    return new Response(upstream.body, { status: upstream.status, headers })
  }

  const key = resolved.reason === 'ok' ? resolved.key : null
  if (!key) {
    return new Response(mediaMissMessage(id, resolved), { status: 404 })
  }

  try {
    const object = await readStoredObject(key, range)
    const body = object.Body
    if (!body || !('transformToWebStream' in body)) {
      return new Response(mediaMissMessage(id, { ...resolved, reason: 'object_missing', key }), { status: 404 })
    }
    const headers = new Headers()
    headers.set('Content-Type', object.ContentType || contentTypeForKey(key))
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'private, max-age=300')
    if (object.ContentLength != null) headers.set('Content-Length', String(object.ContentLength))
    if (object.ContentRange) headers.set('Content-Range', object.ContentRange)
    if (object.ETag) headers.set('ETag', object.ETag)
    return new Response(body.transformToWebStream(), {
      status: object.ContentRange ? 206 : 200,
      headers,
    })
  } catch (err) {
    const name = err instanceof Error ? err.name : ''
    console.warn('[media_stream]', JSON.stringify({ id, name }))
    if (name === 'InvalidRange' || name === 'NoSuchKey') {
      return new Response(name === 'NoSuchKey' ? 'Not found' : 'Range not satisfiable', {
        status: name === 'NoSuchKey' ? 404 : 416,
      })
    }
    return new Response('Media unavailable', { status: 502 })
  }
}
