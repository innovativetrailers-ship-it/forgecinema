import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'
import { z } from 'zod'

const AddCommentSchema = z.object({
  token: z.string(),
  authorName: z.string().min(1).max(100),
  authorEmail: z.string().email(),
  timecode: z.number().min(0),
  clipId: z.string().optional(),
  text: z.string().min(1).max(2000),
  annotationData: z.unknown().optional(),
})

const ResolveCommentSchema = z.object({
  commentId: z.string(),
  resolved: z.boolean(),
})

export async function POST(req: NextRequest) {
  let body: z.infer<typeof AddCommentSchema>
  try {
    body = AddCommentSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { token, authorName, authorEmail, timecode, clipId, text, annotationData } = body

  const reviewLink = await db.reviewLink.findUnique({ where: { token } })
  if (!reviewLink) return NextResponse.json({ error: 'Review link not found' }, { status: 404 })

  if (reviewLink.expiresAt && reviewLink.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Review link has expired' }, { status: 410 })
  }

  const comment = await db.reviewComment.create({
    data: {
      reviewLinkId: reviewLink.id,
      authorName,
      authorEmail,
      timecode,
      clipId,
      text,
      annotationData: annotationData ?? null,
    },
  })

  return NextResponse.json({ comment }, { status: 201 })
}

export async function PATCH(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof ResolveCommentSchema>
  try {
    body = ResolveCommentSchema.parse(await req.json())
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const comment = await db.reviewComment.update({
    where: { id: body.commentId },
    data: { resolved: body.resolved },
  })

  return NextResponse.json({ comment })
}
