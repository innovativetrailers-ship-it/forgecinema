/**
 * Growth Engine Training Pipeline Worker
 * Processes training signals from RLAIF logs and routes them
 * through the distillation and quality-gate pipeline.
 * Run with: tsx src/workers/training-pipeline.ts
 */

import { Worker, Queue } from 'bullmq'
import { bullmqRedis, bullMQPrefix } from '../lib/redis'
import { db } from '../lib/db'
import { runModel1 } from '../lib/brain/model1'
import { evaluateQuality } from '../lib/brain/model2'
import { rlhfMeta } from '../lib/brain/rlhf-meta'

const qualityGateQueue = new Queue('quality-gate', {
  connection: bullmqRedis,
  prefix: bullMQPrefix,
})

const worker = new Worker(
  'training-pipeline',
  async (job) => {
    const { signalId } = job.data as { signalId: string }

    const signal = await db.rLHFLog.findUnique({ where: { id: signalId } })
    if (!signal) { console.warn(`Signal ${signalId} not found`); return }

    const meta = rlhfMeta(signal)
    console.log(`[training-pipeline] Processing signal ${signalId}`)

    // Evaluate video quality
    let qualityScore = meta.qualityScore ?? 0
    if (meta.videoUrl && meta.qualityScore === undefined) {
      try {
        const evaluation = await evaluateQuality(meta.videoUrl, meta.promptRaw)
        qualityScore = evaluation.score

        const opts = (signal.modelOptions ?? {}) as Record<string, unknown>
        await db.rLHFLog.update({
          where: { id: signalId },
          data: {
            modelOptions: { ...opts, qualityScore },
          },
        })
      } catch (err) {
        console.error('[training-pipeline] Evaluation failed:', err)
      }
    }

    // Extract training signal from comparison
    const trainingSignal = await runModel1({
      systemPrompt: `Analyse this video generation result and extract a concise training signal.
Return JSON: { "signal_type": "success|failure|partial", "key_lesson": "string", "routing_hint": "string" }`,
      userMessage: `Prompt: "${meta.promptRaw}"\nEnhanced: "${meta.promptEnhanced}"\nQuality Score: ${qualityScore}`,
      requireJSON: true,
    })

    // Route to quality gate for high-quality signals
    if (qualityScore >= 0.8) {
      await qualityGateQueue.add('evaluate', { signalId, qualityScore, trainingSignal: trainingSignal.content })
    }

    console.log(`[training-pipeline] Signal ${signalId} processed — quality: ${qualityScore.toFixed(2)}`)
  },
  { connection: bullmqRedis, prefix: bullMQPrefix, concurrency: 2 }
)

worker.on('completed', (job) => console.log(`[training-pipeline] Job ${job.id} completed`))
worker.on('failed', (job, err) => console.error(`[training-pipeline] Job ${job?.id} failed:`, err))

console.log('[training-pipeline] Worker started')
