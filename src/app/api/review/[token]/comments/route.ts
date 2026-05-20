import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { z } from 'zod'

const commentSchema = z.object({
  text: z.string().min(1),
  timecode: z.number().optional().default(0),
  authorName: z.string().min(1),
  authorEmail: z.string().email(),
})

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const link = await db.reviewLink.findUnique({ where: { token } })
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const comments = await db.reviewComment.findMany({
    where: { reviewLinkId: link.id },
    orderBy: { createdAt: 'asc' },
  })

  return NextResponse.json({ comments })
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params

  const link = await db.reviewLink.findUnique({ where: { token } })
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  const body = await req.json()
  const parsed = commentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const comment = await db.reviewComment.create({
    data: {
      reviewLinkId: link.id,
      text: parsed.data.text,
      timecode: parsed.data.timecode ?? 0,
      authorName: parsed.data.authorName,
      authorEmail: parsed.data.authorEmail,
      clipId: parsed.data.clipId,
      annotationData: parsed.data.annotationData ?? null,
    },
  })

  return NextResponse.json({ comment }, { status: 201 })
}
