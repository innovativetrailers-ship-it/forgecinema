// src/app/api/generate/route.ts

import { calculateSimpleCost }              from '@/lib/credits'
import { checkAccess, deductUserCredits }   from '@/lib/access/guard'
import { TIER_ENGINE_MAP }                  from '@/lib/routing/engineRegistry'
import { db }                               from '@/lib/db'
import { renderQueue }                      from '@/lib/queue'

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

  let creditCost: number

  if (mode === 'director' && selectedModels.length > 0) {
    const { breakdownToShots, buildDAG, getTotalPlanCost } = await import('@/lib/orchestration')
    const shots  = await breakdownToShots(prompt, duration, { characters: [], locations: [] }, selectedModels)
    const dag    = buildDAG(shots, selectedModels)
    creditCost   = getTotalPlanCost(dag) + 10   // +10 for potential Patient Zero generation
  } else {
    creditCost = calculateSimpleCost(tier, duration)
  }

  const access = await checkAccess(userId, creditCost)
  if (!access.allowed) {
    return Response.json({ error: access.reason }, { status: 402 })
  }

  if (mode === 'director') {
    const job = await db.renderJob.create({
      data: {
        userId,
        prompt,
        duration,
        mode:     'director',
        metadata: { selectedModels, tier },
      },
    })

    await renderQueue.add('orchestrate', {
      jobId: job.id,
      userId,
      prompt,
      duration,
      selectedModels,
      creditCost,
    })

    await deductUserCredits(userId, creditCost, `Director mode: ${prompt.slice(0, 40)}`, 'orchestration')

    return Response.json({ jobId: job.id, queued: true, estimatedCredits: creditCost })

  } else {
    const engine = TIER_ENGINE_MAP[tier] ?? 'ltx-2.3-fast'
    const job    = await db.renderJob.create({
      data: {
        userId,
        prompt,
        duration,
        mode:     'simple',
        metadata: { engine, tier },
      },
    })

    await renderQueue.add('render-simple', { jobId: job.id, userId, prompt, duration, engine })

    await deductUserCredits(userId, creditCost, `Simple ${tier}: ${prompt.slice(0, 40)}`, 'generation')

    return Response.json({ jobId: job.id, queued: true, creditCost })
  }
}
