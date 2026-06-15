import { db } from '@/lib/db'
import { buildChainForScene, groupIntoScenes } from '@/lib/orchestration/chainBuilder'
import type { DAGNode, StructuredShot } from '@/lib/orchestration/types'
import { MODEL_COSTS } from '@/lib/routing/engineRegistry'

function estimateShotCost(model: string, durationSec: number): number {
  const rate = MODEL_COSTS[model] ?? 5
  return Math.max(1, Math.ceil((durationSec / 5) * rate))
}

/** Upsert StudioScene + StudioClip rows from a breakdown shot list. */
export async function syncScenesFromShots(
  projectId: string,
  shots: StructuredShot[],
  options?: { dag?: DAGNode[]; selectedModels?: string[] },
): Promise<void> {
  const dagByShot = new Map((options?.dag ?? []).map((n) => [n.shot.shotIndex, n]))
  const selectedModels = options?.selectedModels ?? []
  const scenes = groupIntoScenes(shots)
  const sceneNumbers = new Set(scenes.map((s) => s.sceneNumber))

  const staleScenes = await db.studioScene.findMany({
    where: { projectId },
    select: { id: true, sceneNumber: true },
  })
  for (const stale of staleScenes) {
    if (!sceneNumbers.has(stale.sceneNumber)) {
      await db.studioClip.deleteMany({ where: { sceneId: stale.id } })
      await db.studioScene.delete({ where: { id: stale.id } })
    }
  }

  for (const scene of scenes) {
    const row = await db.studioScene.upsert({
      where: { projectId_sceneNumber: { projectId, sceneNumber: scene.sceneNumber } },
      create: {
        projectId,
        sceneNumber: scene.sceneNumber,
        title: `Scene ${scene.sceneNumber}`,
        status: 'PENDING',
      },
      update: { title: `Scene ${scene.sceneNumber}` },
    })

    const chain = buildChainForScene(
      scene,
      selectedModels,
      new Map(scene.shots.map((s) => [s.shotIndex, dagByShot.get(s.shotIndex)?.assignedModel ?? 'wan-2.6'])),
      undefined,
      scene.sceneNumber === 1,
    )

    for (let i = 0; i < scene.shots.length; i++) {
      const shot = scene.shots[i]
      const clipMeta = chain[i]
      const node = dagByShot.get(shot.shotIndex)

      const existing = await db.studioClip.findUnique({
        where: { sceneId_clipNumber: { sceneId: row.id, clipNumber: i + 1 } },
        select: {
          modelOverride: true,
          status: true,
          videoUrl: true,
          lastFrame: true,
          manualVideo: true,
        },
      })

      const assignedModel =
        existing?.modelOverride ??
        clipMeta?.assignedModel ??
        node?.assignedModel ??
        'wan-2.6'
      const estimatedCost = node?.estimatedCost ?? estimateShotCost(assignedModel, shot.duration)

      const isLocked =
        existing?.status === 'COMPLETED' ||
        existing?.status === 'MANUAL' ||
        existing?.status === 'GENERATING'

      await db.studioClip.upsert({
        where: { sceneId_clipNumber: { sceneId: row.id, clipNumber: i + 1 } },
        create: {
          sceneId: row.id,
          clipNumber: i + 1,
          prompt: shot.visualPrompt,
          originalPrompt: shot.visualPrompt,
          duration: Math.round(shot.duration),
          keyframeUrl: shot.storyboardUrl,
          scriptBeatId: shot.scriptBeatId,
          assignedModel,
          anchorPolicy: clipMeta?.anchorPolicy ?? 'previous-frame',
          estimatedCost,
          status: 'PENDING',
        },
        update: {
          prompt: shot.visualPrompt,
          originalPrompt: shot.visualPrompt,
          duration: Math.round(shot.duration),
          keyframeUrl: shot.storyboardUrl,
          scriptBeatId: shot.scriptBeatId,
          assignedModel,
          anchorPolicy: clipMeta?.anchorPolicy ?? 'previous-frame',
          estimatedCost,
          ...(isLocked
            ? {
                videoUrl: existing?.videoUrl ?? null,
                lastFrame: existing?.lastFrame ?? null,
                status: existing!.status,
                manualVideo: existing?.manualVideo ?? false,
              }
            : {
                videoUrl: null,
                lastFrame: null,
                status: 'PENDING',
                manualVideo: false,
              }),
        },
      })
    }

    const extraClips = await db.studioClip.findMany({
      where: { sceneId: row.id, clipNumber: { gt: scene.shots.length } },
    })
    if (extraClips.length > 0) {
      await db.studioClip.deleteMany({
        where: { sceneId: row.id, clipNumber: { gt: scene.shots.length } },
      })
    }

    await db.studioScene.update({
      where: { id: row.id },
      data: { status: 'PENDING' },
    })
  }
}
