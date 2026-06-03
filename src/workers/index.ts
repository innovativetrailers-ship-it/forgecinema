// src/workers/index.ts
// BullMQ Worker — handles both orchestrate (Director mode) and render-simple jobs

import { Worker }                from 'bullmq'
import { orchestrateGeneration } from '@/lib/orchestration'
import { callEngine }            from '@/lib/routing/MediaRouter'
import { db }                    from '@/lib/db'

const redisUrl   = new URL(process.env.REDIS_URL!)
const connection = {
  host:     redisUrl.hostname,
  port:     Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  tls:      process.env.REDIS_URL!.startsWith('rediss://') ? {} : undefined,
}

// ── Director mode orchestration worker ────────────────────────────────────
const orchestrationWorker = new Worker('render', async (job) => {
  if (job.name !== 'orchestrate') return

  const { jobId, userId, prompt, duration, selectedModels, creditCost } = job.data as {
    jobId: string; userId: string; prompt: string
    duration: number; selectedModels: string[]; creditCost?: number
  }

  const jobStartTime = Date.now()

  await db.renderJob.update({
    where: { id: jobId },
    data:  { status: 'PROCESSING', progressPct: 2, phase: 'patient_zero', statusMessage: 'Starting…' },
  })

  try {
    const result = await orchestrateGeneration({
      prompt,
      totalDuration:  duration,
      selectedModels,
      userId,
      onProgress: async (phase, detail, pct) => {
        const elapsedSec = (Date.now() - jobStartTime) / 1000
        const etaSeconds = pct > 5
          ? Math.max(0, Math.round((elapsedSec / pct) * (100 - pct)))
          : null

        await db.renderJob.update({
          where: { id: jobId },
          data: {
            progressPct:   pct,
            phase,
            statusMessage: detail,
            ...(etaSeconds !== null ? { etaSeconds } : {}),
          },
        }).catch(() => {})  // never let a progress write crash the job
      },
    })

    // Cost reconciliation — refund difference between estimate and actual
    const estimatedCredits = creditCost ?? result.totalCredits
    const refund           = estimatedCredits - result.totalCredits
    if (refund > 0) {
      const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
      if (user?.role !== 'ADMIN') {
        await db.user.update({
          where: { id: userId },
          data:  { creditBalance: { increment: refund } },
        })
        await db.creditTransaction.create({
          data: { userId, amount: refund, description: 'Orchestration cost reconciliation refund', balanceAfter: 0 },
        })
      }
    }

    await db.renderJob.update({
      where: { id: jobId },
      data: {
        status:        'COMPLETE',
        progressPct:   100,
        phase:         'complete',
        etaSeconds:    0,
        statusMessage: 'Complete',
        outputUrl:     result.finalVideoUrl,
        completedAt:   new Date(),
        metadata: {
          segments:       result.segments,
          modelBreakdown: result.modelBreakdown,
          qualityScores:  result.qualityScores,
          patientZero:    result.patientZero,
          actualCredits:  result.totalCredits,
        },
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[orchestration] job failed:', msg)
    await db.renderJob.update({
      where: { id: jobId },
      data:  { status: 'FAILED', errorMessage: msg, statusMessage: 'Generation failed' },
    })
  }
}, {
  connection,
  concurrency:     2,
  // A multi-segment film can run 30-60+ min. Lock must exceed the LONGEST possible
  // job or BullMQ considers it stalled and retries mid-render.
  // 8 segments × 20 min max + overhead = generous 3 hour ceiling.
  lockDuration:    10_800_000, // 3 hours (was 600_000 = 10 min)
  lockRenewTime:   300_000,    // renew the lock every 5 min so long jobs keep their claim
  stalledInterval: 300_000,    // check for genuinely stalled jobs every 5 min
  maxStalledCount: 1,          // only retry a stalled job once (avoid double-charging renders)
})

// ── Simple mode single-model worker ───────────────────────────────────────
const simpleWorker = new Worker('render', async (job) => {
  if (job.name !== 'render-simple') return

  const { jobId, prompt, duration, engine } = job.data as {
    jobId: string; prompt: string; duration: number; engine: string
  }

  await db.renderJob.update({
    where: { id: jobId },
    data:  { status: 'PROCESSING', progressPct: 20, phase: 'generating', statusMessage: 'Generating video…' },
  })

  try {
    const result = await callEngine({ model: engine, prompt, duration })

    await db.renderJob.update({
      where: { id: jobId },
      data: {
        status:        'COMPLETE',
        progressPct:   100,
        phase:         'complete',
        etaSeconds:    0,
        statusMessage: 'Complete',
        completedAt:   new Date(),
        outputUrl:     result.videoUrl ?? result.imageUrl,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[render-simple] job failed:', msg)
    await db.renderJob.update({
      where: { id: jobId },
      data:  { status: 'FAILED', errorMessage: msg, statusMessage: 'Generation failed' },
    })
  }
}, {
  connection,
  concurrency:     4,
  stalledInterval: 30_000,
  maxStalledCount: 1,
  lockDuration:    300_000,  // 5 min lock for simple jobs
})

orchestrationWorker.on('ready', () => console.log('[worker] orchestration ready'))
simpleWorker.on('ready',        () => console.log('[worker] simple render ready'))

console.log('[workers] All processors registered')
