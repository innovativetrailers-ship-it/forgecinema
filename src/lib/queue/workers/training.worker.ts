import { Worker } from 'bullmq'
import { bullmqRedis, bullMQPrefix } from '../../redis'
import { db } from '../../db'
import { broadcastJobEvent } from '../events'
import { refundCredits } from '../../credits'
import { triggerLoRATraining, pollTrainingStatus } from '../../fal/training'

interface TrainingJobPayload {
  jobId: string
  userId: string
  characterId: string
  imageUrls: string[]
  triggerWord: string
}

const POLL_INTERVAL_MS = 15_000
const TRAINING_TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

export const trainingWorker = new Worker<TrainingJobPayload>(
  'training',
  async (job) => {
    const { jobId, userId, characterId, imageUrls, triggerWord } = job.data

    await db.renderJob.update({
      where: { id: jobId },
      data: { status: 'PROCESSING' },
    })

    await broadcastJobEvent({
      jobId,
      status: 'processing',
      progress: 5,
      message: 'Starting LoRA training…',
    })

    try {
      const requestId = await triggerLoRATraining({
        characterId,
        userId,
        imageUrls,
        triggerWord,
        steps: 1000,
      })

      const startedAt = Date.now()

      while (true) {
        if (Date.now() - startedAt > TRAINING_TIMEOUT_MS) {
          throw new Error('Training timed out after 30 minutes')
        }

        await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS))

        const status = await pollTrainingStatus(requestId, characterId)
        const elapsed = Date.now() - startedAt
        const progress = Math.min(90, Math.round((elapsed / TRAINING_TIMEOUT_MS) * 100))

        await broadcastJobEvent({
          jobId,
          status: 'processing',
          progress,
          message: `Training in progress… (${Math.round(elapsed / 60000)}m elapsed)`,
        })

        if (status === 'READY') {
          await db.renderJob.update({
            where: { id: jobId },
            data: {
              status: 'COMPLETE',
              progressPct: 100,
              completedAt: new Date(),
            },
          })
          await broadcastJobEvent({
            jobId,
            status: 'complete',
            progress: 100,
            message: 'LoRA training complete! Character ready.',
          })
          return
        }

        if (status === 'FAILED') {
          throw new Error('LoRA training failed')
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Training failed'

      const renderJob = await db.renderJob.findUnique({
        where: { id: jobId },
        select: { creditsCharged: true },
      })

      if (renderJob?.creditsCharged) {
        await refundCredits(userId, renderJob.creditsCharged, `Refund for failed training ${jobId}`)
      }

      await db.renderJob.update({
        where: { id: jobId },
        data: { status: 'FAILED', errorMessage: message, completedAt: new Date() },
      })

      await broadcastJobEvent({ jobId, status: 'failed', error: message })
      throw err
    }
  },
  {
    connection: bullmqRedis,
    prefix: bullMQPrefix,
    concurrency: 2,
  }
)

trainingWorker.on('failed', (job, err) => {
  console.error(`[training-worker] Job ${job?.id} failed:`, err.message)
})
