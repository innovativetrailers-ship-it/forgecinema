import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { jobId } = await params

  const job = await db.renderJob.findFirst({
    where: { id: jobId, userId },
    select: {
      id: true,
      type: true,
      status: true,
      progressPct: true,
      outputUrl: true,
      outputUrls: true,
      errorMessage: true,
      creditsCharged: true,
      modelUsed: true,
      createdAt: true,
      completedAt: true,
    },
  })

  if (!job) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json(job)
}
