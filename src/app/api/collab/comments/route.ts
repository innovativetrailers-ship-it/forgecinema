import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// GET — list comments for a clip
export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  const clipId = req.nextUrl.searchParams.get('clipId')

  if (!projectId?.trim()) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })

  try {
    const where = clipId?.trim()
      ? { projectId: projectId.trim(), clipId: clipId.trim(), parentId: null }
      : { projectId: projectId.trim(), parentId: null }

    const comments = await db.clipComment.findMany({
      where,
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ comments })
  } catch {
    return NextResponse.json({ comments: [] })
  }
}

// POST — create a top-level comment or reply
export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const o = raw as Record<string, unknown>
  if (typeof o.projectId !== 'string' || !o.projectId.trim()) return NextResponse.json({ error: 'projectId is required' }, { status: 400 })
  if (typeof o.clipId !== 'string' || !o.clipId.trim()) return NextResponse.json({ error: 'clipId is required' }, { status: 400 })
  if (typeof o.text !== 'string' || !o.text.trim()) return NextResponse.json({ error: 'text is required' }, { status: 400 })
  if (typeof o.timecode !== 'number') return NextResponse.json({ error: 'timecode is required' }, { status: 400 })

  try {
    const comment = await db.clipComment.create({
      data: {
        projectId: o.projectId.trim(),
        clipId: o.clipId.trim(),
        authorId: userId,
        timecode: o.timecode,
        text: o.text.trim(),
        parentId: typeof o.parentId === 'string' ? o.parentId : null,
      },
      include: { replies: true },
    })
    return NextResponse.json({ comment }, { status: 201 })
  } catch (err: unknown) {
    console.error('[collab/comments POST]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
  }
}

// PATCH — resolve / unresolve a comment
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let raw: unknown
  try { raw = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const o = raw as Record<string, unknown>
  if (typeof o.commentId !== 'string' || !o.commentId.trim())
    return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
  if (typeof o.resolved !== 'boolean')
    return NextResponse.json({ error: 'resolved (boolean) is required' }, { status: 400 })

  try {
    const comment = await db.clipComment.update({
      where: { id: o.commentId.trim() },
      data: { resolved: o.resolved },
    })
    return NextResponse.json({ comment })
  } catch {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
  }
}
