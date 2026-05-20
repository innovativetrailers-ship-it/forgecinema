import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { notifyProjectOwner } from '@/lib/review'

const approveSchema = z.object({
  decision: z.enum(['approved', 'changes_requested']),
  approverName: z.string().min(1).max(100),
  approverEmail: z.string().email(),
  note: z.string().max(2000).optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const link = await db.reviewLink.findUnique({ where: { token } })
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  const body = await req.json()
  const parsed = approveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { decision, approverName, approverEmail, note } = parsed.data

  await db.reviewLink.update({
    where: { id: link.id },
    data: { status: decision },
  })

  const label = decision === 'approved' ? 'APPROVED' : 'CHANGES REQUESTED'
  await db.reviewComment.create({
    data: {
      reviewLinkId: link.id,
      text: `${label}${note ? `: ${note}` : ''}`,
      timecode: 0,
      authorName: approverName,
      authorEmail: approverEmail,
    },
  })

  await notifyProjectOwner({
    reviewLinkId: token,
    projectId: link.projectId,
    ownerUserId: link.userId,
    title: link.title,
    decision,
    approverName,
    approverEmail,
    note,
  })

  return NextResponse.json({ success: true, status: decision })
}
