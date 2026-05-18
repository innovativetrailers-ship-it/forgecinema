import { db } from '../db'

export async function getLockedModelFamily(characterId: string): Promise<string | null> {
  const character = await db.vaultCharacter.findUnique({
    where: { id: characterId },
    select: { modelFamily: true },
  })
  return character?.modelFamily ?? null
}

export async function setModelLockIfNeeded(
  characterId: string,
  modelUsed: string
): Promise<void> {
  const character = await db.vaultCharacter.findUnique({
    where: { id: characterId },
    select: { modelFamily: true },
  })

  // Lock is permanent — never overwrite once set
  if (character && !character.modelFamily) {
    const family = getModelFamily(modelUsed)
    await db.vaultCharacter.update({
      where: { id: characterId },
      data: { modelFamily: family },
    })
  }
}

function getModelFamily(modelId: string): string {
  if (modelId.startsWith('kling')) return 'kling'
  if (modelId === 'veo3') return 'veo3'
  if (modelId === 'luma') return 'luma'
  if (modelId === 'runway') return 'runway'
  if (modelId === 'seedance') return 'seedance'
  if (modelId === 'minimax') return 'minimax'
  if (modelId === 'pika') return 'pika'
  return 'wan'
}

export function enforceModelLock(
  requestedModel: string,
  lockedFamily: string | null
): string {
  if (!lockedFamily) return requestedModel

  // Map locked family to best available model in that family
  const familyBestModel: Record<string, string> = {
    kling: requestedModel.includes('pro') ? 'kling_pro' : 'kling_standard',
    veo3: 'veo3',
    luma: 'luma',
    runway: 'runway',
    seedance: 'seedance',
    minimax: 'minimax',
    pika: 'pika',
    wan: 'wan',
  }

  return familyBestModel[lockedFamily] ?? requestedModel
}
