import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveReviewVideoUrl } from '@/lib/review'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params

  const link = await db.reviewLink.findUnique({ where: { token } })
  if (!link) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (link.expiresAt && link.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Link expired' }, { status: 410 })
  }

  const videoUrl = await resolveReviewVideoUrl(link.projectId)
  if (!videoUrl) {
    return NextResponse.json(
      { error: 'No exported video yet. Export the project first.' },
      { status: 404 },
    )
  }

  return NextResponse.redirect(videoUrl, { status: 302 })
}
