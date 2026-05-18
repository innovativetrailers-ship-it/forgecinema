import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../lib/auth'
import { checkAndDeductCredits, refundCredits, OPERATION_COSTS } from '../../../../lib/credits'
import { upscaleClip } from '../../../../lib/upscale/clip'
import { routeUpscaleEngine, engineCreditKey } from '../../../../lib/upscale/router'
import type { UpscaleJob } from '../../../../lib/upscale/router'
import { db } from '../../../../lib/db'

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { videoUrl: string; job: UpscaleJob; clipId?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { videoUrl, job, clipId } = body
  if (!videoUrl || !job) {
    return NextResponse.json({ error: 'videoUrl and job are required' }, { status: 400 })
  }

  const creditKey = engineCreditKey(routeUpscaleEngine(job), job.targetFactor, false)
  if (!(creditKey in OPERATION_COSTS)) {
    return NextResponse.json({ error: 'Unknown upscale operation' }, { status: 400 })
  }

  try {
    await checkAndDeductCredits(userId, creditKey)
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 402 })
  }

  try {
    const { upscaledUrl, resolutionOut } = await upscaleClip({ videoUrl, job })

    return NextResponse.json({ upscaledUrl, resolutionOut, clipId })
  } catch (e) {
    await refundCredits(userId, OPERATION_COSTS[creditKey] ?? 0, 'Upscale clip failed')
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
