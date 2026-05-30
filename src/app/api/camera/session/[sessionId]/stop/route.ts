import { type NextRequest, NextResponse } from 'next/server'
import { stopCameraSession, getCameraSession } from '@/lib/camera/WirelessIngest'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { sessionId } = await params
  const session = await getCameraSession(sessionId)
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })
  if (session.userId !== userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await stopCameraSession(sessionId)
  return NextResponse.json({ ok: true })
}
