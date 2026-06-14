import type { SceneSegment } from './types'
import * as models from '../models'
import type { SwarmPayload } from '../models'
import { generateVideo as generateLuma, pollStatus as pollLuma } from '../models/luma'
import { extractTailFrame } from '../orchestration/bridgedGeneration'
import { continuityAgent, applyContinuity, type ContinuityState } from '@/lib/cognition/agents/continuityAgent'

type SegmentResult = { segmentId: string; videoUrl: string }

type GenerateFn = (payload: SwarmPayload) => Promise<string>

const MAX_PARALLEL_CHAINS = 4

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
  ltx:            models.generateLTXSwarm,
  hunyuan:        models.generateHunyuan,
  pixverse:       (p) => models.generatePixverse(p, 'pixverse-v6'),
  pixverse_c1:    (p) => models.generatePixverse(p, 'pixverse-c1'),
  'pixverse-c1':  (p) => models.generatePixverse(p, 'pixverse-c1'),
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

function groupByShot(segments: SceneSegment[]): SceneSegment[][] {
  const map = new Map<string, SceneSegment[]>()
  for (const seg of segments) {
    const key = seg.shotId
    const list = map.get(key) ?? []
    list.push(seg)
    map.set(key, list)
  }
  return [...map.values()].map((chain) =>
    chain.sort((a, b) => a.startSeconds - b.startSeconds),
  )
}

async function dispatchChain(
  chain: SceneSegment[],
  onSegmentComplete?: (segmentId: string, videoUrl: string) => void,
): Promise<SegmentResult[]> {
  const results: SegmentResult[] = []
  let anchorFrameUrl: string | undefined
  let continuity: ContinuityState | null = null

  for (const seg of chain) {
    const generate = resolveGenerator(seg.engineId)
    const characterRefs = await getCharacterRefs(seg.characterIds)
    const duration = Math.max(1, seg.endSeconds - seg.startSeconds)

    let prompt = seg.prompt
    try {
      continuity = await continuityAgent.execute({ shotPrompt: seg.prompt, prior: continuity })
      prompt = applyContinuity(prompt, continuity)
    } catch { /* best-effort */ }

    const startFrameUrl = anchorFrameUrl ?? seg.anchorStartFrameUrl ?? seg.styleReferenceUrl

    const videoUrl = await generate({
      prompt,
      negativePrompt: 'blurry, watermark, duplicate faces, overexposed',
      duration,
      aspectRatio: '16:9',
      characterRefs,
      startFrameUrl,
    })

    onSegmentComplete?.(seg.segmentId, videoUrl)
    results.push({ segmentId: seg.segmentId, videoUrl })

    const isLast = chain.indexOf(seg) === chain.length - 1
    if (!isLast) {
      try {
        anchorFrameUrl = await extractTailFrame(videoUrl)
      } catch {
        anchorFrameUrl = undefined
      }
    }
  }

  return results
}

export async function dispatchClip(params: {
  segments: SceneSegment[]
  onSegmentComplete?: (segmentId: string, videoUrl: string) => void
}): Promise<SegmentResult[]> {
  const chains = groupByShot(params.segments)
  const all: SegmentResult[] = []

  for (let i = 0; i < chains.length; i += MAX_PARALLEL_CHAINS) {
    const batch = chains.slice(i, i + MAX_PARALLEL_CHAINS)
    const batchResults = await Promise.all(
      batch.map((chain) => dispatchChain(chain, params.onSegmentComplete)),
    )
    batchResults.forEach((r) => all.push(...r))
  }

  return all
}
