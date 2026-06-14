import { db } from '@/lib/db'
import { broadcastJobEvent } from '@/lib/queue/events'
import { refundCredits } from '@/lib/credits'
import { triggerLoRATraining, pollTrainingStatus } from '@/lib/fal/training'

export interface TrainingJobPayload {
  jobId: string
  userId: string
  characterId: string
  imageUrls: string[]
  triggerWord: string
}

const POLL_INTERVAL_MS = 15_000
const TRAINING_TIMEOUT_MS = 30 * 60 * 1000

async function updateProgress(jobId: string, progress: number, message: string) {
  await db.renderJob.update({
    where: { id: jobId },
    data: { status: 'PROCESSING', progressPct: progress, statusMessage: message },
  })
  await broadcastJobEvent({ jobId, status: 'processing', progress, message })
}

export async function processTrainingJob(payload: TrainingJobPayload): Promise<void> {
  const { jobId, userId, characterId, imageUrls, triggerWord } = payload

  await updateProgress(jobId, 5, 'Starting LoRA training…')

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

      await updateProgress(
        jobId,
        progress,
        `Training in progress… (${Math.round(elapsed / 60000)}m elapsed)`,
      )

      if (status === 'READY') {
        await db.renderJob.update({
          where: { id: jobId },
          data: {
            status: 'COMPLETE',
            progressPct: 100,
            statusMessage: 'LoRA training complete! Character ready.',
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
      data: {
        status: 'FAILED',
        errorMessage: message,
        statusMessage: message,
        completedAt: new Date(),
      },
    })

    await broadcastJobEvent({ jobId, status: 'failed', error: message })
    throw err
  }
}

export async function processTrainingJobWithRefund(payload: TrainingJobPayload): Promise<void> {
  try {
    await processTrainingJob(payload)
  } catch (err) {
    console.error('[processTrainingJob]', err instanceof Error ? err.message : err)
  }
}
