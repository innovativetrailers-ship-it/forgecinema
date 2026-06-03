import { type NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { updateRoutingPolicy } from '@/lib/cognition/memory/procedural'

// Implicit reward: export is a strong positive, regenerate a strong negative, etc.
const REWARD_MAP: Record<string, number> = {
  export: 1.0,
  watch_complete: 0.5,
  thumbs_up: 0.8,
  regenerate: -1.0,
  discard: -0.5,
  thumbs_down: -0.8,
}

interface JobSegment {
  model: string
  contentType?: string
  qualityScore?: number
}

function extractSegments(metadata: unknown): JobSegment[] {
  if (!metadata || typeof metadata !== 'object') return []
  const segs = (metadata as { segments?: unknown }).segments
  if (!Array.isArray(segs)) return []
  return segs.filter((s): s is JobSegment => !!s && typeof s === 'object' && typeof (s as JobSegment).model === 'string')
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { jobId?: string; signal?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { jobId, signal } = body
  if (!signal || !(signal in REWARD_MAP))
    return NextResponse.json(
      { error: `Unknown signal. Valid: ${Object.keys(REWARD_MAP).join(', ')}` },
      { status: 400 },
    )

  const reward = REWARD_MAP[signal]

  const job = jobId
    ? await db.renderJob.findUnique({ where: { id: jobId } }).catch(() => null)
    : null
  const segments = extractSegments(job?.metadata)

  await db.rewardSignal.create({ data: { userId, jobId: jobId ?? null, signal, reward } })

  // Reinforce models in an exported film; penalise models in a regenerated one.
  for (const seg of segments) {
    const adjusted = Math.max(0, Math.min(1, (seg.qualityScore ?? 0.7) + reward * 0.2))
    await updateRoutingPolicy(seg.contentType ?? 'unknown', seg.model, adjusted, 60).catch(() => {})
  }

  return NextResponse.json({ recorded: true })
}
