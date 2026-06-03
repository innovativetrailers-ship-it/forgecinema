// Live performance matrix — latency, cost, and success tracked in real time, with
// a circuit breaker so a model that is slow or erroring right now is deprioritised
// immediately (not just by historical policy).

import { db } from '@/lib/db'
import { MODEL_COSTS } from '@/lib/routing/engineRegistry'

const FAILURE_CIRCUIT_THRESHOLD = 3 // consecutive failures → mark down

export async function recordPerformance(params: {
  model: string
  latencyMs: number
  success: boolean
}): Promise<void> {
  const existing = await db.modelPerformance.findUnique({ where: { model: params.model } }).catch(() => null)
  const cost = MODEL_COSTS[params.model] ?? 10

  if (!existing) {
    await db.modelPerformance.create({
      data: {
        model: params.model,
        avgLatencyMs: params.latencyMs,
        p95LatencyMs: params.latencyMs,
        successRate: params.success ? 1 : 0,
        recentFailures: params.success ? 0 : 1,
        costPer5sCredits: cost,
        sampleCount: 1,
        status: params.success ? 'healthy' : 'degraded',
      },
    })
    return
  }

  const n = existing.sampleCount
  const newLatency = (existing.avgLatencyMs * n + params.latencyMs) / (n + 1)
  const newSuccess = (existing.successRate * Math.min(n, 20) + (params.success ? 1 : 0)) / (Math.min(n, 20) + 1)
  const failures = params.success ? 0 : existing.recentFailures + 1
  const p95 = Math.max(existing.p95LatencyMs * 0.9, params.latencyMs) // decaying p95

  const status =
    failures >= FAILURE_CIRCUIT_THRESHOLD ? 'down' :
    (newLatency > 600_000 || newSuccess < 0.6) ? 'degraded' : 'healthy'

  await db.modelPerformance.update({
    where: { model: params.model },
    data: {
      avgLatencyMs: newLatency,
      p95LatencyMs: p95,
      successRate: newSuccess,
      recentFailures: failures,
      status,
      sampleCount: n + 1,
      lastCheckedAt: new Date(),
    },
  })
}

// Cost-benefit score for routing: high success + low latency + reasonable cost = high score.
export async function scoreModelsLive(pool: string[]): Promise<Record<string, number>> {
  const perfs = await db.modelPerformance.findMany({ where: { model: { in: pool } } })
  const perfMap = new Map(perfs.map(p => [p.model, p]))

  const scores: Record<string, number> = {}
  for (const model of pool) {
    const p = perfMap.get(model)
    if (!p) { scores[model] = 0.5; continue } // unknown = neutral
    if (p.status === 'down') { scores[model] = 0; continue } // circuit broken

    const speedScore = Math.max(0, 1 - p.avgLatencyMs / 600_000) // 0 at 10min, 1 at instant
    const costScore = Math.max(0, 1 - p.costPer5sCredits / 35) // 0 at most expensive
    const penalty = p.status === 'degraded' ? 0.5 : 1
    scores[model] = (p.successRate * 0.5 + speedScore * 0.3 + costScore * 0.2) * penalty
  }
  return scores
}

// Models currently safe to use (circuit breaker open).
export async function getHealthyModels(pool: string[]): Promise<string[]> {
  const perfs = await db.modelPerformance.findMany({ where: { model: { in: pool }, status: 'down' } })
  const down = new Set(perfs.map(p => p.model))
  return pool.filter(m => !down.has(m))
}
