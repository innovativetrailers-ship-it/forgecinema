import { db } from '../db'
import { uploadToR2 } from '../storage/r2'
import { extractCharacterFeatures } from '../fal/character'
import {
  generateCharacterPlate,
  ingestPhotoReferences,
  CharacterIngestionError,
} from '../character/ingestion'
import { nanoid } from 'nanoid'

export interface CreateCharacterInput {
  projectId: string
  name: string
  description?: string
  imageBuffers: Array<{ buffer: Buffer; filename: string; contentType: string }>
  triggerWord?: string
  modelFamily?: string
}

export async function createCharacter(input: CreateCharacterInput) {
  const { projectId, name, description, imageBuffers, triggerWord, modelFamily } = input

  let referenceUrls: string[]

  if (imageBuffers.length === 0) {
    const plateUrl = await generateCharacterPlate({
      name,
      description: description?.trim() || name,
    })
    const key = `vault/characters/${projectId}/${nanoid()}.png`
    const plateRes = await fetch(plateUrl)
    if (!plateRes.ok) {
      throw new CharacterIngestionError('Could not persist generated character plate')
    }
    const plateBuffer = Buffer.from(await plateRes.arrayBuffer())
    referenceUrls = [await uploadToR2(plateBuffer, key, 'image/png')]
  } else {
    referenceUrls = await Promise.all(
      imageBuffers.map(async ({ buffer, filename, contentType }) => {
        const ext = filename.split('.').pop() ?? 'jpg'
        const key = `vault/characters/${projectId}/${nanoid()}.${ext}`
        return uploadToR2(buffer, key, contentType)
      }),
    )
  }

  const buffers = imageBuffers.map((b) => b.buffer)
  const ingested = await ingestPhotoReferences(referenceUrls, buffers.length ? buffers : undefined)

  const character = await db.vaultCharacter.create({
    data: {
      projectId,
      name,
      referenceUrls,
      modelFamily: modelFamily && modelFamily !== 'any' ? modelFamily : undefined,
      faceEmbedding: {
        embedding: ingested.faceEmbedding,
        bodyEmbedding: ingested.bodyEmbedding,
      } as never,
      styleJson: ingested.appearance as never,
    },
  })

  // Kick off feature extraction async (don't await — non-blocking)
  if (referenceUrls.length > 0) {
    extractCharacterFeatures(referenceUrls).then((features) => {
      db.vaultCharacter.update({
        where: { id: character.id },
        data: {
          styleJson: JSON.parse(JSON.stringify(features)) as never,
        },
      }).catch(console.error)
    }).catch(console.error)
  }

  return character
}

export async function queueCharacterLoraTraining(params: {
  userId: string
  projectId: string
  characterId: string
  imageUrls: string[]
  triggerWord: string
}): Promise<string> {
  const { checkAndDeductCredits, OPERATION_COSTS } = await import('../credits')
  const { trainingQueue, getPriorityForRole } = await import('../queue')
  const cost = OPERATION_COSTS.lora_training ?? 50

  await checkAndDeductCredits(params.userId, 'lora_training')

  const user = await db.user.findUnique({
    where: { id: params.userId },
    select: { role: true },
  })

  const renderJob = await db.renderJob.create({
    data: {
      userId: params.userId,
      projectId: params.projectId,
      type: 'LORA_TRAIN',
      status: 'QUEUED',
      creditsCharged: cost,
      inputPayload: {
        characterId: params.characterId,
        imageUrls: params.imageUrls,
        triggerWord: params.triggerWord,
      } as never,
      priority: getPriorityForRole(user?.role ?? 'FREE'),
    },
  })

  const jobData = {
    jobId: renderJob.id,
    userId: params.userId,
    characterId: params.characterId,
    imageUrls: params.imageUrls,
    triggerWord: params.triggerWord,
  }

  if (process.env.VERCEL) {
    const { after } = await import('next/server')
    const { processTrainingJobWithRefund } = await import('../jobs/processTrainingJob')
    after(() => processTrainingJobWithRefund(jobData))
  } else {
    await trainingQueue.add('train', jobData, {
      priority: getPriorityForRole(user?.role ?? 'FREE'),
      attempts: 1,
    })
  }

  return renderJob.id
}

export async function getCharacter(id: string) {
  return db.vaultCharacter.findUnique({ where: { id } })
}

export async function listCharacters(projectId?: string, userId?: string) {
  return db.vaultCharacter.findMany({
    where: projectId
      ? { projectId }
      : userId
        ? { project: { userId } }
        : {},
    orderBy: { renderCount: 'desc' },
  })
}

export async function deleteCharacter(id: string) {
  return db.vaultCharacter.delete({ where: { id } })
}
