import { db } from '../db'
import { nanoid } from 'nanoid'

export interface RLHFLogInput {
  userId: string
  promptText: string
  modelOptions: string[]
  selectedModel: string
  selectedIdx: number
  context?: Record<string, unknown>
}

export async function logRLHFSelection(input: RLHFLogInput): Promise<void> {
  await db.rLHFLog.create({
    data: {
      userId: input.userId,
      sessionId: nanoid(),
      promptText: input.promptText,
      modelOptions: input.modelOptions,
      selectedModel: input.selectedModel,
      selectedIdx: input.selectedIdx,
      context: input.context ? JSON.parse(JSON.stringify(input.context)) : undefined,
    },
  })
}

export async function logApiUsage(params: {
  provider: string
  model: string
  userId?: string
  jobId?: string
  costCents: number
  latencyMs: number
  success: boolean
}): Promise<void> {
  await db.apiUsageLog.create({ data: params })
}
