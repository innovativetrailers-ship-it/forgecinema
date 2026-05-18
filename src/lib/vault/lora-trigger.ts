import { db } from '../db'
import { triggerLoRATraining } from '../fal/training'

const LORA_TRIGGER_THRESHOLD = 10

export async function loraAutoTrigger(
  characterId: string,
  userId: string
): Promise<void> {
  const character = await db.vaultCharacter.findUnique({
    where: { id: characterId },
    select: {
      id: true,
      renderCount: true,
      loraStatus: true,
      referenceUrls: true,
      name: true,
    },
  })

  if (!character) return

  // Only trigger if threshold reached and not already training/ready
  if (
    character.renderCount < LORA_TRIGGER_THRESHOLD ||
    character.loraStatus !== 'PENDING'
  ) {
    return
  }

  if (character.referenceUrls.length < 3) return

  const triggerWord = character.name.toLowerCase().replace(/\s+/g, '_')

  await triggerLoRATraining({
    characterId,
    userId,
    imageUrls: character.referenceUrls,
    triggerWord,
    steps: 1000,
  })
}

export async function incrementRenderCount(characterId: string): Promise<void> {
  await db.vaultCharacter.update({
    where: { id: characterId },
    data: { renderCount: { increment: 1 } },
  })
}
