import type { SceneSegment } from './types'
import * as models from '../models'
import type { SwarmPayload } from '../models'
import { generateVideo as generateLuma, pollStatus as pollLuma } from '../models/luma'

type SegmentResult = { segmentId: string; videoUrl: string }

type GenerateFn = (payload: SwarmPayload) => Promise<string>

async function generateLumaVideo(payload: SwarmPayload): Promise<string> {
  const started = await generateLuma({
    prompt: payload.prompt,
    duration: payload.duration,
    aspectRatio: payload.aspectRatio,
    startFrameUrl: payload.startFrameUrl,
  })
  for (let i = 0; i < 120; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    const status = await pollLuma(started.jobId)
    if (status.status === 'complete' && status.videoUrl) return status.videoUrl
    if (status.status === 'failed') throw new Error(status.error ?? 'Luma generation failed')
  }
  throw new Error('Luma generation timed out')
}

const ENGINE_GENERATORS: Record<string, GenerateFn> = {
  kling_pro:      models.generateKling30,
  kling_standard: models.generateKling30,
  kling:          models.generateKling30,
  veo3:           models.generateVeo3,
  veo_3_1:        models.generateVeo3,
  seedance:       models.generateSeedance20,
  runway:         models.generateRunway,
  luma:           generateLumaVideo,
  pika:           models.generatePika,
  minimax:        models.generateMinimax,
  wan:            models.generateWan22,
  wan_2_2:        models.generateWan22,
  skyreels:       models.generateSkyReelsSwarm,
  cogvideox:      models.generateCogVideoXSwarm,
  ltx:            models.generateLTXSwarm,
  hunyuan:        models.generateHunyuan,
  pixverse:       models.generatePixverse,
}

function resolveGenerator(engineId: string): GenerateFn {
  return ENGINE_GENERATORS[engineId] ?? models.generateWan22
}

async function getCharacterRefs(characterIds?: string[]): Promise<string[]> {
  if (!characterIds?.length) return []
  const { db } = await import('../db')
  const chars = await db.vaultCharacter.findMany({
    where: { id: { in: characterIds } },
    select: { referenceUrls: true },
  })
  return chars.flatMap((c) => c.referenceUrls ?? [])
}

export async function dispatchClip(params: {
  segments: SceneSegment[]
  onSegmentComplete?: (segmentId: string, videoUrl: string) => void
}): Promise<SegmentResult[]> {
  const promises = params.segments.map(async (seg): Promise<SegmentResult> => {
    const generate = resolveGenerator(seg.engineId)
    const characterRefs = await getCharacterRefs(seg.characterIds)
    const duration = Math.max(1, seg.endSeconds - seg.startSeconds)

    const videoUrl = await generate({
      prompt: seg.prompt,
      negativePrompt: 'blurry, watermark, duplicate faces, overexposed',
      duration,
      aspectRatio: '16:9',
      characterRefs,
      startFrameUrl: seg.anchorStartFrameUrl,
    })

    params.onSegmentComplete?.(seg.segmentId, videoUrl)
    return { segmentId: seg.segmentId, videoUrl }
  })

  return Promise.all(promises)
}
