import pLimit from 'p-limit'
import { db } from '@/lib/db'
import { runFal, extractVideoUrl } from '@/lib/fal/client'
import { loadCheckpoint, saveCheckpoint } from './checkpoints'
import {
  LIP_SYNC_ENGINES,
  lipSyncEngineForMode,
  type LipSyncEngineKey,
} from './lipSyncRegistry'
import type { GeneratedSegment } from './types'

const limit = pLimit(3)

export async function runLipSyncPass(
  clips: GeneratedSegment[],
  projectId: string | undefined,
  jobId: string,
  mode: 'draft' | 'production' = 'draft',
  onPhase?: (detail: string) => void,
): Promise<GeneratedSegment[]> {
  if (!projectId) return clips
  const out = [...clips]

  await Promise.all(out.map((clip, i) => limit(async () => {
    const studioClip = clip.shotId
      ? await db.studioClip.findUnique({ where: { id: clip.shotId } })
      : await findClipByShotIndex(projectId, clip.shotIndex)

    if (studioClip && !studioClip.lipSyncEnabled) return

    const line = await db.audioTrack.findFirst({
      where: {
        projectId,
        shotPlanId: studioClip?.id ?? clip.shotId,
        type: 'DIALOGUE',
        status: 'READY',
        muted: false,
        url: { not: null },
      },
    })
    if (!line?.url) return

    const ckKey = `lipsync_${studioClip?.id ?? clip.shotIndex}_v${line.version}`
    const existing = await loadCheckpoint(jobId, ckKey)
    if (existing?.videoUrl) {
      out[i] = { ...clip, videoUrl: existing.videoUrl }
      return
    }

    onPhase?.(`Lip sync shot ${i + 1}/${out.length}`)

    const engineKey = (studioClip?.lipSyncModel as LipSyncEngineKey | null)
      ?? lipSyncEngineForMode(mode)
    const engine = LIP_SYNC_ENGINES[engineKey] ?? LIP_SYNC_ENGINES.latentsync

    try {
      const result = await runFal(engine.endpoint, engine.payload({
        videoUrl: clip.videoUrl,
        audioUrl: line.url,
        syncMode: 'cut_off',
      }))
      const syncedUrl = extractVideoUrl(result)
      if (!syncedUrl) throw new Error('Lip sync returned no video')

      if (studioClip) {
        await db.studioClip.update({
          where: { id: studioClip.id },
          data: {
            rawVideoUrl: studioClip.rawVideoUrl ?? clip.videoUrl,
            videoUrl: syncedUrl,
          },
        })
      }

      const synced = { ...clip, videoUrl: syncedUrl }
      await saveCheckpoint({
        jobId,
        segmentId: ckKey,
        shotId: clip.shotIndex,
        videoUrl: syncedUrl,
        modelUsed: engineKey,
        cost: 0,
        qaPassed: true,
      })
      out[i] = synced
    } catch (err) {
      console.warn(`[lipsync] shot ${clip.shotIndex} failed:`, err instanceof Error ? err.message : err)
    }
  })))

  return out
}

async function findClipByShotIndex(projectId: string, shotIndex: number) {
  const { listShotPlan } = await import('@/lib/studio/shotPlan')
  const { shots } = await listShotPlan(projectId)
  const card = shots.find((s) => s.shotNumber === shotIndex + 1)
  if (!card) return null
  return db.studioClip.findUnique({ where: { id: card.id } })
}

export async function applyLipSyncToShot(
  clipId: string,
  projectId: string,
  mode: 'draft' | 'production' = 'draft',
): Promise<string> {
  const clip = await db.studioClip.findUnique({
    where: { id: clipId },
    include: { scene: { select: { projectId: true } } },
  })
  if (!clip || clip.scene.projectId !== projectId) {
    throw new Error('Clip not found')
  }
  if (!clip.videoUrl) throw new Error('Clip has no video')

  const line = await db.audioTrack.findFirst({
    where: {
      projectId,
      shotPlanId: clipId,
      type: 'DIALOGUE',
      status: 'READY',
      muted: false,
      url: { not: null },
    },
  })
  if (!line?.url) throw new Error('No dialogue track for this shot')

  const engineKey = (clip.lipSyncModel as LipSyncEngineKey | null) ?? lipSyncEngineForMode(mode)
  const engine = LIP_SYNC_ENGINES[engineKey] ?? LIP_SYNC_ENGINES.latentsync

  const result = await runFal(engine.endpoint, engine.payload({
    videoUrl: clip.rawVideoUrl ?? clip.videoUrl,
    audioUrl: line.url,
    syncMode: 'cut_off',
  }))
  const syncedUrl = extractVideoUrl(result)
  if (!syncedUrl) throw new Error('Lip sync returned no video')

  await db.studioClip.update({
    where: { id: clipId },
    data: {
      rawVideoUrl: clip.rawVideoUrl ?? clip.videoUrl,
      videoUrl: syncedUrl,
    },
  })

  return syncedUrl
}

export async function revertLipSync(clipId: string): Promise<string | null> {
  const clip = await db.studioClip.findUnique({ where: { id: clipId } })
  if (!clip?.rawVideoUrl) return clip?.videoUrl ?? null

  await db.studioClip.update({
    where: { id: clipId },
    data: { videoUrl: clip.rawVideoUrl },
  })
  return clip.rawVideoUrl
}
