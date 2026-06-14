// src/workers/index.ts
// BullMQ Worker — handles both orchestrate (Director mode) and render-simple jobs

import { Worker }     from 'bullmq'
import { callEngine } from '@/lib/routing/MediaRouter'
import { db }         from '@/lib/db'

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

  const { jobId, userId, duration, selectedModels, creditCost, useCognition, generationMode, source, projectId } =
    job.data as {
      jobId: string; userId: string; prompt?: string; script?: string
      duration: number; selectedModels?: string[]; creditCost?: number; useCognition?: boolean
      generationMode?: 'draft' | 'production'; source?: string; projectId?: string
    }

  const { resolveOrchestrationScript } = await import('@/lib/jobs/resolveOrchestrationScript')
  const prompt = await resolveOrchestrationScript(jobId, job.data as { prompt?: string; script?: string })
  console.log('[orchestrate] Received job payload:', {
    prompt: prompt.slice(0, 100),
    jobId,
    source: source ?? 'unknown',
  })

  let councilModels = selectedModels ?? []
  if (!councilModels.length) {
    const row = await db.renderJob.findUnique({
      where: { id: jobId },
      select: { metadata: true },
    })
    const meta = row?.metadata as { selectedModels?: string[] } | null
    councilModels = meta?.selectedModels ?? []
  }

  const { processOrchestrateJobWithRefund } = await import('@/lib/jobs/processOrchestrateJob')
  try {
    await processOrchestrateJobWithRefund({
      jobId,
      userId,
      prompt,
      duration,
      selectedModels: councilModels,
      creditCost,
      useCognition: useCognition ?? true,
      projectId,
      generationMode: generationMode ?? 'draft',
      source,
      heartbeat: async () => { await job.updateProgress(job.progress ?? 0) },
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[orchestration] job failed:', msg)
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
