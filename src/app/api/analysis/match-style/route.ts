import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { checkAndDeductCredits, refundCredits } from '@/lib/credits'
import { ReferenceVideoAnalyser } from '@/lib/analysis/ReferenceVideoAnalyser'

const analyser = new ReferenceVideoAnalyser()

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = req.headers.get('x-user-id') ?? session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as {
    referenceVideoUrl: string
    targetShotListId?: string
    shots?: Record<string, unknown>[]
  }

  if (!body.referenceVideoUrl) {
    return NextResponse.json({ error: 'referenceVideoUrl is required' }, { status: 400 })
  }

  const ok = await checkAndDeductCredits(userId, 'reference_style_apply')
  if (!ok) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })

  try {
    const styleDNA = await analyser.analyseReference({
      videoUrl: body.referenceVideoUrl,
      analysisDepth: 'standard',
    })

    let shots: Record<string, unknown>[] = body.shots ?? []

    if (body.targetShotListId && shots.length === 0) {
      const job = await db.renderJob.findUnique({ where: { id: body.targetShotListId } })
      if (job?.inputPayload) {
        shots = [(job.inputPayload as Record<string, unknown>)]
      }
    }

    const updatedShots = analyser.applyStyleDNAToShotList(shots, styleDNA)

    return NextResponse.json({ styleDNA, updatedShots })
  } catch (err) {
    await refundCredits(userId, 'reference_style_apply')
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Style matching failed' }, { status: 500 })
  }
}
