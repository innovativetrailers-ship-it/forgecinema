import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveReviewVideoUrl } from '@/lib/review'

/** Public review portal payload for `/review/[token]` page */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const link = await db.reviewLink.findUnique({
    where: { token },
    include: {
      comments: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!link) return NextResponse.json({ error: 'Review portal not found' }, { status: 404 })
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Review link expired' }, { status: 410 })
  }

  const videoUrl = await resolveReviewVideoUrl(link.projectId)

  return NextResponse.json({
    title: link.title,
    status: link.status,
    allowDownload: link.allowDownload,
    projectId: link.projectId,
    videoUrl,
    comments: link.comments.map((c) => ({
      id: c.id,
      authorName: c.authorName,
      authorEmail: c.authorEmail,
      timecode: c.timecode,
      text: c.text,
      resolved: c.resolved,
      createdAt: c.createdAt.toISOString(),
    })),
  })
}
