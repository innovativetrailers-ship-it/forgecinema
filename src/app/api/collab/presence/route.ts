import { type NextRequest, NextResponse } from 'next/server'
import { getProjectPresence, updatePresence } from '@/lib/collab/presence'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId) {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  const presence = await getProjectPresence(projectId)
  return NextResponse.json({ presence })
}

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body: unknown = await req.json()
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const {
    projectId,
    displayName,
    avatarUrl,
    playheadTime,
    selectedClipId,
  } = body as Record<string, unknown>

  if (typeof projectId !== 'string') {
    return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  }

  await updatePresence(projectId, userId, {
    displayName: typeof displayName === 'string' ? displayName : undefined,
    avatarUrl: typeof avatarUrl === 'string' ? avatarUrl : avatarUrl === null ? null : undefined,
    playheadTime: typeof playheadTime === 'number' ? playheadTime : undefined,
    selectedClipId:
      typeof selectedClipId === 'string'
        ? selectedClipId
        : selectedClipId === null
          ? null
          : undefined,
  })

  return NextResponse.json({ ok: true })
}
