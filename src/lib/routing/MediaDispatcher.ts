import type { SceneSegment } from './types'
import * as models from '../models'

type SegmentResult = { segmentId: string; videoUrl: string }

async function getEngineClient(engineId: string) {
  const clientMap: Record<string, unknown> = {
    kling_pro:  models.kling,
    kling_standard: models.kling,
    veo3:       models.veo3,
    seedance:   models.seedance,
    runway:     models.runway,
    luma:       models.luma,
    pika:       models.pika,
    minimax:    models.minimax,
    wan:        models.wan,
    skyreels:   models.skyreels,
    cogvideox:  models.cogvideox,
    ltx:        models.ltx,
  }
  return clientMap[engineId] ?? models.wan
}

async function getCharacterRefs(characterIds?: string[]): Promise<string[]> {
  if (!characterIds?.length) return []
  const { db } = await import('../db')
  const chars = await db.vaultCharacter.findMany({
    where: { id: { in: characterIds } },
    select: { referenceImageUrls: true },
  })
  return chars.flatMap((c) => c.referenceImageUrls ?? [])
}

export async function dispatchClip(params: {
  segments: SceneSegment[]
  onSegmentComplete?: (segmentId: string, videoUrl: string) => void
}): Promise<SegmentResult[]> {
  const promises = params.segments.map(async (seg): Promise<SegmentResult> => {
    const engine = await getEngineClient(seg.engineId) as {
      generateVideo?: (p: unknown) => Promise<{ videoUrl: string }>
      generate?: (p: unknown) => Promise<{ videoUrl: string; url?: string }>
    }

    const characterRefs = await getCharacterRefs(seg.characterIds)
    const duration = seg.endSeconds - seg.startSeconds

    let videoUrl: string

    if (engine.generateVideo) {
      const result = await engine.generateVideo({
        prompt: seg.prompt,
        duration,
        startFrameUrl: seg.anchorStartFrameUrl,
        endFrameUrl: seg.anchorEndFrameUrl,
        characterRefs,
      })
      videoUrl = result.videoUrl
    } else if (engine.generate) {
      const result = await engine.generate({
        prompt: seg.prompt,
        duration,
        characterRefs,
      })
      videoUrl = result.videoUrl ?? result.url ?? ''
    } else {
      throw new Error(`Engine ${seg.engineId} has no generate method`)
    }

    params.onSegmentComplete?.(seg.segmentId, videoUrl)
    return { segmentId: seg.segmentId, videoUrl }
  })

  return Promise.all(promises)
}
