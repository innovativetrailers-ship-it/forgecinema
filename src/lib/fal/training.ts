import { fal } from './client'
import { db } from '../db'

export interface LoRATrainingInput {
  characterId: string
  userId: string
  imageUrls: string[]
  triggerWord: string
  steps?: number
}

export async function triggerLoRATraining(input: LoRATrainingInput): Promise<string> {
  interface FalResult {
    request_id: string
  }

  await db.vaultCharacter.update({
    where: { id: input.characterId },
    data: { loraStatus: 'TRAINING' },
  })

  const result = await fal.queue.submit('fal-ai/flux-lora-fast-training', {
    input: {
      images_data_url: input.imageUrls[0],
      trigger_word: input.triggerWord,
      steps: input.steps ?? 1000,
      is_style: false,
    },
    webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/fal`,
  }) as FalResult

  return result.request_id
}

export async function pollTrainingStatus(
  requestId: string,
  characterId: string
): Promise<'TRAINING' | 'READY' | 'FAILED'> {
  interface FalQueueStatus {
    status: string
  }

  const status = await fal.queue.status('fal-ai/flux-lora-fast-training', {
    requestId,
    logs: false,
  }) as FalQueueStatus

  if (status.status === 'COMPLETED') {
    interface FalLoRAResult {
      diffusers_lora_file?: { url: string }
    }

    const result = await fal.queue.result('fal-ai/flux-lora-fast-training', {
      requestId,
    }) as FalLoRAResult

    await db.vaultCharacter.update({
      where: { id: characterId },
      data: {
        loraStatus: 'READY',
        loraModelId: result.diffusers_lora_file?.url,
      },
    })
    return 'READY'
  }

  if (status.status === 'FAILED') {
    await db.vaultCharacter.update({
      where: { id: characterId },
      data: { loraStatus: 'FAILED' },
    })
    return 'FAILED'
  }

  return 'TRAINING'
}
