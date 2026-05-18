/**
 * Distillation Worker
 * Periodically reads approved training data and generates
 * routing optimisation reports for the MediaRouter.
 * Run with: tsx src/workers/distillation.ts
 */

import IORedis from 'ioredis'
import { db } from '../lib/db'
import { runModel1 } from '../lib/brain/model1'

const redis = new IORedis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  keyPrefix: 'cinema:',
})

const DISTILLATION_INTERVAL_MS = 6 * 60 * 60 * 1000 // every 6 hours

async function runDistillation() {
  console.log('[distillation] Starting distillation run...')

  // Fetch recent approved training data
  const signals = await db.trainingData.findMany({
    where: { approved: true },
    orderBy: { createdAt: 'desc' },
    take: 200,
  }).catch(() => [] as Awaited<ReturnType<typeof db.trainingData.findMany>>)

  if (signals.length === 0) {
    console.log('[distillation] No approved signals found, skipping.')
    return
  }

  // Group by dataset type
  const byDataset: Record<string, typeof signals> = {}
  for (const sig of signals) {
    const ds = sig.dataset ?? 'general'
    byDataset[ds] = [...(byDataset[ds] ?? []), sig]
  }

  for (const [dataset, datasetSignals] of Object.entries(byDataset)) {
    const summary = datasetSignals.map((s) =>
      `Prompt: "${s.promptRaw}" | Quality: ${s.qualityScore?.toFixed(2)} | Dataset: ${s.dataset}`
    ).join('\n')

    const report = await runModel1({
      systemPrompt: `You are analysing a batch of high-quality AI video generation examples for the "${dataset}" dataset.
Identify patterns, routing recommendations, and lessons learned.
Return JSON: {
  "top_patterns": ["string"],
  "routing_updates": [{"scene_type": "string", "recommended_engine": "string", "reason": "string"}],
  "prompt_patterns": ["string"],
  "summary": "string"
}`,
      userMessage: summary,
      requireJSON: true,
    })

    const reportKey = `cinema:distillation:${dataset}:${Date.now()}`
    await redis.set(reportKey, report.content, 'EX', 7 * 24 * 60 * 60) // 7 days TTL

    console.log(`[distillation] Report for "${dataset}" stored at ${reportKey}`)
  }

  console.log(`[distillation] Distillation complete. Processed ${signals.length} signals.`)
}

// Run immediately then on interval
runDistillation().catch(console.error)
setInterval(() => runDistillation().catch(console.error), DISTILLATION_INTERVAL_MS)

process.on('SIGTERM', () => { redis.quit(); process.exit(0) })
