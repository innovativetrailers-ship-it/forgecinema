import { db } from '../db'

export interface RepaintDelta {
  userId: string
  jobId: string
  originalVideoUrl: string
  originalPrompt: string
  newPrompt: string
  regeneratedVideoUrl?: string
}

export async function captureRepaintDelta(delta: RepaintDelta): Promise<void> {
  await db.trainingData.create({
    data: {
      userId: delta.userId,
      type: 'repaint_delta',
      originalUrl: delta.originalVideoUrl,
      instruction: delta.newPrompt,
      regeneratedUrl: delta.regeneratedVideoUrl,
      metadata: {
        jobId: delta.jobId,
        originalPrompt: delta.originalPrompt,
      },
    },
  })
}

export async function captureGeneration(params: {
  userId: string
  prompt: string
  modelUsed: string
  outputUrl: string
  inputPayload: Record<string, unknown>
}): Promise<void> {
  await db.trainingData.create({
    data: {
      userId: params.userId,
      type: 'generation',
      originalUrl: params.outputUrl,
      instruction: params.prompt,
      metadata: JSON.parse(JSON.stringify({
        model: params.modelUsed,
        input: params.inputPayload,
      })),
    },
  })
}
