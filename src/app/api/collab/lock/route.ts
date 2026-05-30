import { type NextRequest, NextResponse } from 'next/server'
import { getOrCreateSession } from '@/lib/collab'

// GET — list all active clip locks for a project
export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const projectId = req.nextUrl.searchParams.get('projectId')
  if (!projectId?.trim())
    return NextResponse.json({ error: 'projectId query param is required' }, { status: 400 })

  const session = getOrCreateSession(projectId.trim())
  const locks: Record<string, string> = {}
  session.activeClipLocks.forEach((lockedByUserId, clipId) => {
    locks[clipId] = lockedByUserId
  })

  return NextResponse.json({ locks })
}
