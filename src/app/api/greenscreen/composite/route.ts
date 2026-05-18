import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { checkAndDeductCredits, refundCredits } from '@/lib/credits'
import { GreenScreenEngine } from '@/lib/greenscreen/GreenScreenEngine'
import type { GreenScreenJob, BackdropConfig } from '@/lib/greenscreen/GreenScreenEngine'
import { fal } from '@/lib/fal/client'

const gsEngine = new GreenScreenEngine()

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId = req.headers.get('x-user-id') ?? session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json() as GreenScreenJob

  if (!body.sourceVideoUrl || !body.extractionMode || !body.backdrop) {
    return NextResponse.json({ error: 'sourceVideoUrl, extractionMode and backdrop are required' }, { status: 400 })
  }

  const extractionCreditKey = body.extractionMode === 'chroma_key' ? 'greenscreen_chroma_key' : 'greenscreen_ai_matting'
  const backdropCreditKey = body.backdrop.source === 'ai_generated' ? 'backdrop_ai_generate' : 'backdrop_composite'

  const okExtraction = await checkAndDeductCredits(userId, extractionCreditKey)
  if (!okExtraction) return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 })

  const okBackdrop = await checkAndDeductCredits(userId, backdropCreditKey)
  if (!okBackdrop) {
    await refundCredits(userId, extractionCreditKey)
    return NextResponse.json({ error: 'Insufficient credits for backdrop generation' }, { status: 402 })
  }

  try {
    const compositedUrl = await gsEngine.processGreenScreen(body)

    // Generate preview frame
    const preview = await fal.run('fal-ai/video-frame-extractor', {
      video_url: compositedUrl,
      timestamp: 0.5,
    }) as { image_url: string }

    return NextResponse.json({ composited_url: compositedUrl, preview_frame: preview.image_url })
  } catch (err) {
    await refundCredits(userId, extractionCreditKey)
    await refundCredits(userId, backdropCreditKey)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Compositing failed' }, { status: 500 })
  }
}
