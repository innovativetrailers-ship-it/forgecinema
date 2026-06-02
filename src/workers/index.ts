// src/workers/index.ts
// BullMQ Worker — handles both orchestrate (Director mode) and render-simple jobs

import { Worker }                from 'bullmq'
import { orchestrateGeneration } from '@/lib/orchestration'
import { callEngine }            from '@/lib/routing/MediaRouter'
import { db }                    from '@/lib/db'

const redisUrl  = new URL(process.env.REDIS_URL!)
const connection = {
  host:     redisUrl.hostname,
  port:     Number(redisUrl.port) || 6379,
  password: redisUrl.password || undefined,
  tls:      process.env.REDIS_URL!.startsWith('rediss://') ? {} : undefined,
}

// ── Director mode orchestration worker ────────────────────────────────────
const orchestrationWorker = new Worker('render', async (job) => {
  if (job.name !== 'orchestrate') return

  const { jobId, userId, prompt, duration, selectedModels } = job.data as {
    jobId: string; userId: string; prompt: string
    duration: number; selectedModels: string[]
  }

  await db.renderJob.update({
    where: { id: jobId },
    data:  { status: 'PROCESSING', progressPct: 5 },
  })

  try {
    const result = await orchestrateGeneration({
      prompt,
      totalDuration:  duration,
      selectedModels,
      userId,
      onProgress: async (phase, detail, pct) => {
        await db.renderJob.update({
          where: { id: jobId },
          data:  { progressPct: pct, statusMessage: `${phase}: ${detail}` },
        }).catch(() => {})
      },
    })

    await db.renderJob.update({
      where: { id: jobId },
      data: {
        status:    'COMPLETE',
        progressPct: 100,
        outputUrl: result.finalVideoUrl,
        metadata: {
          segments:       result.segments,
          modelBreakdown: result.modelBreakdown,
          qualityScores:  result.qualityScores,
          patientZero:    result.patientZero,
        },
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[orchestration] job failed:', msg)
    await db.renderJob.update({
      where: { id: jobId },
      data:  { status: 'FAILED', errorMessage: msg },
    })
  }
}, { connection, concurrency: 2 })

// ── Simple mode single-model worker ───────────────────────────────────────
const simpleWorker = new Worker('render', async (job) => {
  if (job.name !== 'render-simple') return

  const { jobId, prompt, duration, engine } = job.data as {
    jobId: string; prompt: string; duration: number; engine: string
  }

  await db.renderJob.update({
    where: { id: jobId },
    data:  { status: 'PROCESSING', progressPct: 20 },
  })

  try {
    const result = await callEngine({ model: engine, prompt, duration })

    await db.renderJob.update({
      where: { id: jobId },
      data: {
        status:    'COMPLETE',
        progressPct: 100,
        outputUrl: result.videoUrl ?? result.imageUrl,
      },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[render-simple] job failed:', msg)
    await db.renderJob.update({
      where: { id: jobId },
      data:  { status: 'FAILED', errorMessage: msg },
    })
  }
}, { connection, concurrency: 4 })

orchestrationWorker.on('ready', () => console.log('[worker] orchestration ready'))
simpleWorker.on('ready',        () => console.log('[worker] simple render ready'))

console.log('[workers] All processors registered')
