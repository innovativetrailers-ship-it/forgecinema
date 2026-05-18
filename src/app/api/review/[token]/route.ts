import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const portal = await db.reviewLink.findUnique({
    where: { token },
    include: {
      comments: { orderBy: { createdAt: 'desc' } },
    },
  })

  if (!portal) return NextResponse.json({ error: 'Review portal not found' }, { status: 404 })
  if (portal.expiresAt && portal.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Review link expired' }, { status: 410 })
  }

  return NextResponse.json(portal)
}
