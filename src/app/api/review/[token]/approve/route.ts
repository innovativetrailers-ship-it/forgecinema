import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  const { approverName, approverEmail, note } = await req.json() as {
    approverName?: string
    approverEmail?: string
    note?: string
  }

  const link = await db.reviewLink.findUnique({ where: { token } })
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  // Add an approval comment to record who approved and when
  await db.reviewComment.create({
    data: {
      reviewLinkId: link.id,
      text: `APPROVED${note ? `: ${note}` : ''}`,
      timecode: 0,
      authorName: approverName ?? 'Approver',
      authorEmail: approverEmail ?? 'approver@review',
    },
  })

  return NextResponse.json({ success: true, status: 'APPROVED' })
}
