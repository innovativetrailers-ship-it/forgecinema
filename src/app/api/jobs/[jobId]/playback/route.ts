import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { signedPlaybackUrl } from '@/lib/storage/persistMedia'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth()
  const userId = request.headers.get('x-user-id') ?? session?.user?.id
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params

  const job = await db.renderJob.findFirst({
    where: { id: jobId, userId },
    select: { status: true, outputUrl: true },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  if (job.status !== 'COMPLETE' || !job.outputUrl) {
    return NextResponse.json({ error: 'Video not ready' }, { status: 404 })
  }

  const playbackUrl = await signedPlaybackUrl(jobId, userId, job.outputUrl)
  if (!playbackUrl) {
    return NextResponse.json(
      {
        error: 'Video unavailable',
        hint: 'The provider link expired before it was archived. Regenerate this clip.',
      },
      { status: 404 },
    )
  }

  const download = request.nextUrl.searchParams.get('download') === '1'
  const response = NextResponse.redirect(playbackUrl, 302)
  if (download) {
    response.headers.set('Content-Disposition', `attachment; filename="cinema_${jobId}.mp4"`)
  }
  return response
}
