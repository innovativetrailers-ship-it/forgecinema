import { db } from '@/lib/db'
import { advanceChain, getOrderedClips } from './advanceChain'

const clipIdCache = new Map<string, Map<number, string>>()

async function clipIdForShotIndex(projectId: string, shotIndex: number): Promise<string | null> {
  let byIndex = clipIdCache.get(projectId)
  if (!byIndex) {
    const ordered = await getOrderedClips(db, projectId)
    byIndex = new Map(ordered.map((c) => [c.shotNumber - 1, c.id]))
    clipIdCache.set(projectId, byIndex)
  }
  return byIndex.get(shotIndex) ?? null
}

export function invalidateBatchClipCache(projectId: string): void {
  clipIdCache.delete(projectId)
}

export async function markBatchClipGenerating(projectId: string, shotIndex: number): Promise<void> {
  const clipId = await clipIdForShotIndex(projectId, shotIndex)
  if (!clipId) return
  await db.studioClip.updateMany({
    where: {
      id: clipId,
      status: { in: ['PENDING', 'AWAITING_DIRECTION', 'FAILED'] },
    },
    data: { status: 'GENERATING', generatingAt: new Date() },
  })
}

export async function markBatchClipCompleted(
  projectId: string,
  shotIndex: number,
  videoUrl: string,
  lastFrame?: string,
): Promise<void> {
  const clipId = await clipIdForShotIndex(projectId, shotIndex)
  if (!clipId) return
  await db.$transaction(async (tx) => {
    await tx.studioClip.update({
      where: { id: clipId },
      data: {
        status: 'COMPLETED',
        videoUrl,
        lastFrame: lastFrame ?? null,
        generatingAt: null,
        manualVideo: false,
      },
    })
    await advanceChain(tx, projectId, clipId, lastFrame ?? null)
  })
}

export async function markBatchClipFailed(projectId: string, shotIndex: number): Promise<void> {
  const clipId = await clipIdForShotIndex(projectId, shotIndex)
  if (!clipId) return
  await db.studioClip.update({
    where: { id: clipId },
    data: { status: 'FAILED', generatingAt: null },
  })
}
