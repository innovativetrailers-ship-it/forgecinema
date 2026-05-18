import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { decomposeClip } from '@/lib/routing/SceneDecomposer'
import { nanoid } from 'nanoid'

const schema = z.object({
  prompt:          z.string().min(1),
  duration:        z.number().min(1).max(120).default(5),
  tier:            z.enum(['draft', 'standard', 'cinematic', 'film']).default('standard'),
  characterIds:    z.array(z.string()).optional(),
  locationId:      z.string().optional(),
  forceMultiEngine: z.boolean().optional(),
})

const TIER_LABEL: Record<string, string> = {
  draft: 'Draft', standard: 'Standard', cinematic: 'Cinematic', film: 'Film',
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { prompt, duration, tier, characterIds, locationId, forceMultiEngine } = parsed.data

  try {
    const segments = await decomposeClip({
      masterPrompt: prompt,
      clipId: nanoid(8),
      duration,
      tier: TIER_LABEL[tier] ?? 'Standard',
      characterIds,
      locationId,
      forceMultiEngine,
    })

    return NextResponse.json({
      segments,
      multiEngine: segments.length > 1,
      estimatedTotalCredits: segments.reduce((s, seg) => s + seg.estimatedCredits, 0),
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
