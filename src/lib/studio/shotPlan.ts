import { db } from '@/lib/db'
import { falLog } from '@/lib/fal/falQueue'
import { buildChainForScene, groupIntoScenes } from '@/lib/orchestration/chainBuilder'
import { buildDAG } from '@/lib/orchestration/dagRouter'
import { breakdownToShots } from '@/lib/orchestration/scriptBreakdown'
import { syncScenesFromShots } from '@/lib/studio/sceneSync'
import { MODEL_COSTS } from '@/lib/routing/engineRegistry'
import type { DAGNode, StructuredShot } from '@/lib/orchestration/types'

export interface ShotPlanCard {
  id: string
  shotNumber: number
  sceneNumber: number
  sceneId: string
  prompt: string
  originalPrompt: string
  duration: number
  aspectRatio: string
  assignedModel: string
  modelOverride?: string
  status: 'pending' | 'awaiting_direction' | 'generating' | 'completed' | 'failed' | 'manual'
  videoUrl?: string
  lastFrame?: string
  keyframeUrl?: string
  anchorFrameUrl?: string
  anchorSource: 'auto' | 'manual' | 'keyframe' | 'none'
  directionNotes?: string
  anchorPolicy: string
  manualVideo: boolean
  estimatedCost: number
  lipSyncEnabled: boolean
  dialogueTrackId?: string
  dialogueText?: string
  dialogueVoiceId?: string
  durationWarning?: boolean
}

function mapAnchorSource(source: string): ShotPlanCard['anchorSource'] {
  switch (source) {
    case 'AUTO': return 'auto'
    case 'MANUAL': return 'manual'
    case 'KEYFRAME': return 'keyframe'
    default: return 'none'
  }
}

function mapClipStatus(
  status: string,
): ShotPlanCard['status'] {
  switch (status) {
    case 'AWAITING_DIRECTION': return 'awaiting_direction'
    case 'GENERATING': return 'generating'
    case 'COMPLETED': return 'completed'
    case 'FAILED': return 'failed'
    case 'MANUAL': return 'manual'
    default: return 'pending'
  }
}

export async function listShotPlan(projectId: string): Promise<{ shots: ShotPlanCard[]; totalCost: number }> {
  const dialogueTracks = await db.audioTrack.findMany({
    where: { projectId, type: 'DIALOGUE' },
  })
  const dialogueByClip = new Map(
    dialogueTracks.filter((t) => t.shotPlanId).map((t) => [t.shotPlanId!, t]),
  )

  const scenes = await db.studioScene.findMany({
    where: { projectId },
    include: { clips: { orderBy: { clipNumber: 'asc' } } },
    orderBy: { sceneNumber: 'asc' },
  })

  const shots: ShotPlanCard[] = []
  let shotNumber = 0
  for (const scene of scenes) {
    for (const clip of scene.clips) {
      shotNumber++
      shots.push({
        id: clip.id,
        shotNumber,
        sceneNumber: scene.sceneNumber,
        sceneId: scene.id,
        prompt: clip.prompt,
        originalPrompt: clip.originalPrompt ?? clip.prompt,
        duration: clip.duration,
        aspectRatio: clip.aspectRatio,
        assignedModel: clip.assignedModel ?? 'wan-2.6',
        modelOverride: clip.modelOverride ?? undefined,
        status: mapClipStatus(clip.status),
        videoUrl: clip.videoUrl ?? undefined,
        lastFrame: clip.lastFrame ?? undefined,
        keyframeUrl: clip.keyframeUrl ?? undefined,
        anchorFrameUrl: clip.anchorFrameUrl ?? undefined,
        anchorSource: mapAnchorSource(clip.anchorSource),
        directionNotes: clip.directionNotes ?? undefined,
        anchorPolicy: clip.anchorPolicy,
        manualVideo: clip.manualVideo,
        estimatedCost: clip.estimatedCost,
        lipSyncEnabled: clip.lipSyncEnabled,
        dialogueTrackId: dialogueByClip.get(clip.id)?.id,
        dialogueText: dialogueByClip.get(clip.id)?.prompt ?? undefined,
        dialogueVoiceId: dialogueByClip.get(clip.id)?.voiceId ?? undefined,
        durationWarning: dialogueByClip.get(clip.id)?.durationWarning ?? false,
      })
    }
  }

  const totalCost = shots.reduce((a, s) => a + s.estimatedCost, 0)
  return { shots, totalCost }
}

export async function parseScriptToShotPlan(input: {
  projectId: string
  script: string
  selectedModels: string[]
  duration?: number
}): Promise<{ shots: StructuredShot[]; dag: DAGNode[] }> {
  const duration = input.duration ?? 60
  const shots = await breakdownToShots(
    input.script,
    duration,
    { characters: [], locations: [] },
    input.selectedModels,
  )
  const dag = await buildDAG(shots, input.selectedModels)
  await syncScenesFromShots(input.projectId, shots, { dag, selectedModels: input.selectedModels })
  return { shots, dag }
}

export function estimateShotCost(model: string, durationSec: number): number {
  const rate = MODEL_COSTS[model] ?? 5
  return Math.max(1, Math.ceil((durationSec / 5) * rate))
}

export async function getClipAnchorFrame(
  projectId: string,
  globalShotNumber: number,
): Promise<string | undefined> {
  const { shots } = await listShotPlan(projectId)
  const prev = shots.find((s) => s.shotNumber === globalShotNumber - 1)
  return prev?.lastFrame ?? prev?.videoUrl
}

export function logChainBuilt(
  sceneNumber: number,
  sceneId: string,
  chain: ReturnType<typeof buildChainForScene>,
): void {
  falLog('info', 'chain_built', {
    sceneId,
    sceneNumber,
    clips: chain.map((c) => ({
      shotNumber: c.shotNumber,
      anchorPolicy: c.anchorPolicy,
      hasKeyframe: !!c.keyframeUrl,
      hasStartFrame: !!c.startFrameUrl,
      model: c.assignedModel,
    })),
  })
}
