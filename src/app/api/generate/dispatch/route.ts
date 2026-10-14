import { NextRequest, NextResponse } from 'next/server'
import { refuseSilentModelSwap } from '@/lib/orchestration/costGuard'
import { z } from 'zod'
import { dispatchClip } from '@/lib/routing/MediaDispatcher'
import { blendMultiEngineClip } from '@/lib/routing/SeamlessBlender'
import { checkAndDeductCredits, refundCredits } from '@/lib/credits'
import { directChargeCredits } from '@/lib/credits/quote'
import { db } from '@/lib/db'
import type { SceneSegment } from '@/lib/routing/types'
import { requireUser } from '@/lib/auth/requireUser'

const segmentSchema = z.object({
  segmentId:          z.string(),
  clipId:             z.string(),
  startSeconds:       z.number(),
  endSeconds:         z.number(),
  prompt:             z.string(),
  engineId:           z.string(),
  tier:               z.string(),
  requirements:       z.array(z.string()),
  characterIds:       z.array(z.string()).optional(),
  anchorStartFrameUrl: z.string().optional(),
  anchorEndFrameUrl:   z.string().optional(),
  estimatedCredits:   z.number(),
})

const schema = z.object({
  segments: z.array(segmentSchema).min(1),
  blend:    z.boolean().default(true),
})

export async function POST(req: NextRequest) {
  const userId = (await requireUser(req))?.id ?? null
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { segments, blend } = parsed.data

  let totalCredits = 0
  try {
    totalCredits = directChargeCredits(segments.map((seg) => ({
      model: seg.engineId,
      durationSeconds: Math.max(1, seg.endSeconds - seg.startSeconds),
    })))
    await checkAndDeductCredits(db, userId, totalCredits, 'dispatch')
  } catch (err) {
    console.warn('[dispatch] quote', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'No price for this model' }, { status: 402 })
  }

  try {
    const results = await dispatchClip({ segments: segments as SceneSegment[] })

    if (!blend || results.length === 1) {
      return NextResponse.json({ results, blendedUrl: results[0]?.videoUrl ?? null })
    }

    const { blendedUrl } = await blendMultiEngineClip({
      segments: results.map((r) => ({
        segmentId: r.segmentId,
        videoUrl: r.videoUrl,
        engineId: segments.find((s) => s.segmentId === r.segmentId)?.engineId ?? refuseSilentModelSwap(r.segmentId, 'wan'),
      })),
    })

    return NextResponse.json({ results, blendedUrl })
  } catch (err) {
    console.warn('[dispatch]', err instanceof Error ? err.message : err)
    if (totalCredits > 0) {
      try {
        await refundCredits(db, userId, totalCredits, 'dispatch failed')
      } catch (refundErr) {
        console.warn('[dispatch] refund', refundErr instanceof Error ? refundErr.message : refundErr)
      }
    }
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Dispatch failed' }, { status: 500 })
  }
}
