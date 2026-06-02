// src/app/api/generate/route.ts
// Fast path — never waits for rendering. Returns jobId in <2s.

export const maxDuration = 30  // Fluid Compute; we return in <2s regardless

import { fastEstimateCost, estimateRenderSeconds } from '@/lib/orchestration/fastEstimate'
import { calculateSimpleCost }                     from '@/lib/credits'
import { checkAccess, deductUserCredits }          from '@/lib/access/guard'
import { TIER_ENGINE_MAP }                         from '@/lib/routing/engineRegistry'
import { db }                                      from '@/lib/db'

export async function POST(req: Request) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const {
    prompt,
    duration       = 10,
    selectedModels = [] as string[],
    mode           = 'simple',
    tier           = 'standard',
  } = await req.json()

  if (!prompt) return Response.json({ error: 'prompt is required' }, { status: 400 })

  // FAST estimate — no Claude call, returns instantly
  const creditCost = mode === 'director' && selectedModels.length > 0
    ? fastEstimateCost(selectedModels, duration)
    : calculateSimpleCost(tier, duration)

  const access = await checkAccess(userId, creditCost)
  if (!access.allowed) {
    return Response.json({ error: access.reason }, { status: 402 })
  }

  const etaSeconds = estimateRenderSeconds(selectedModels, duration)
  const engine     = TIER_ENGINE_MAP[tier] ?? 'ltx-2.3-fast'

  const job = await db.renderJob.create({
    data: {
      userId,
      prompt,
      duration,
      mode,
      status:        'QUEUED',
      progressPct:   0,
      statusMessage: 'Queued — waiting for an available worker',
      etaSeconds,
      metadata: { selectedModels, tier, engine, estimatedCredits: creditCost },
    },
  })

  // Queue — the only thing the route waits for (milliseconds)
  try {
    const { renderQueue } = await import('@/lib/queue')
    await renderQueue.add(
      mode === 'director' ? 'orchestrate' : 'render-simple',
      { jobId: job.id, userId, prompt, duration, selectedModels, tier, engine, creditCost },
      { attempts: 1, removeOnComplete: 200, removeOnFail: 500 }
    )
  } catch {
    await db.renderJob.update({
      where: { id: job.id },
      data:  { status: 'FAILED', errorMessage: 'Queue unavailable — check REDIS_URL' },
    })
    return Response.json({ error: 'Render queue unavailable. Try again shortly.' }, { status: 503 })
  }

  // Deduct AFTER successful queue (admin = no-op)
  await deductUserCredits(userId, creditCost, `${mode}: ${prompt.slice(0, 40)}`, 'fal')

  return Response.json({
    jobId:            job.id,
    queued:           true,
    estimatedCredits: creditCost,
    etaSeconds,
  })
}
