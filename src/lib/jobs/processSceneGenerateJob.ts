import { db } from '@/lib/db'
import { appendJobProgressEvent } from '@/lib/jobs/jobProgressEvents'
import { buildDAG } from '@/lib/orchestration/dagRouter'
import { generateAllScenes } from '@/lib/orchestration/chainGeneration'
import { groupIntoScenes } from '@/lib/orchestration/chainBuilder'
import { extractDialogueForShots } from '@/lib/orchestration/dialogueExtractor'
import { generateVoiceLines } from '@/lib/audio/dialoguePipeline'
import { runLipSyncPass } from '@/lib/orchestration/lipSyncPass'
import type { StructuredShot } from '@/lib/orchestration/types'

export interface ProcessSceneGenerateInput {
  jobId: string
  userId: string
  projectId: string
  sceneId: string
  sceneNumber: number
  isFirstScene: boolean
  crossSceneAnchor?: string
  selectedModels: string[]
  mode: 'draft' | 'production'
}

export async function processSceneGenerateJob(input: ProcessSceneGenerateInput): Promise<void> {
  const {
    jobId, projectId, sceneId, sceneNumber, isFirstScene,
    crossSceneAnchor, selectedModels, mode,
  } = input

  const scene = await db.studioScene.findUnique({
    where: { id: sceneId },
    include: { clips: { orderBy: { clipNumber: 'asc' } } },
  })
  if (!scene) throw new Error(`Scene ${sceneId} not found`)

  const baseIndex = (sceneNumber - 1) * 100
  const shots: StructuredShot[] = scene.clips.map((clip, i) => ({
    shotIndex: baseIndex + i,
    startSeconds: 0,
    endSeconds: clip.duration,
    duration: clip.duration,
    contentType: 'dialogue_closeup' as const,
    visualPrompt: clip.prompt,
    cameraMove: 'slow_push_in',
    motionLevel: 'medium',
    hasDialogue: false,
    hasFaces: true,
    hasAudio: false,
    hasCGI: false,
    charactersPresent: [],
    locationsPresent: [],
    lighting: 'natural_day',
    mood: 'calm',
    bridgeRequired: i > 0,
    sceneNumber,
    scriptBeatId: clip.scriptBeatId ?? undefined,
    continuityGroup: sceneNumber,
    isChainStart: isFirstScene && i === 0,
    storyboardUrl: clip.keyframeUrl ?? undefined,
  }))

  const dag = await buildDAG(shots, selectedModels)
  const sceneGroup = groupIntoScenes(shots)[0]

  await appendJobProgressEvent(
    jobId,
    { phase: `scene_${sceneNumber}_start`, status: 'running', detail: 'Generating scene…', pct: 10 },
    { status: 'PROCESSING', progressPct: 10, phase: 'generating' },
  )

  let segments = await generateAllScenes(
    shots,
    dag,
    { characters: [], locations: [] },
    ({ shotIndex, totalShots, status }) => {
      const pct = 10 + Math.round((shotIndex / Math.max(totalShots, 1)) * 70)
      void appendJobProgressEvent(
        jobId,
        { phase: 'generating', status: 'running', detail: `Shot ${shotIndex + 1}/${totalShots}: ${status}`, pct },
        { progressPct: pct },
      )
    },
    {
      jobId,
      generationMode: mode,
      selectedModels,
      onPhase: (phase, detail) => {
        void appendJobProgressEvent(jobId, { phase, status: 'running', detail, pct: 50 }, {})
      },
    },
  )

  await extractDialogueForShots(shots, projectId)
  await generateVoiceLines(projectId, jobId)
  segments = await runLipSyncPass(segments, projectId, jobId, mode ?? 'draft')

  const lastSeg = segments[segments.length - 1]
  if (lastSeg?.tailFrameUrl) {
    await db.studioScene.update({
      where: { id: sceneId },
      data: { transitionFrame: lastSeg.tailFrameUrl, status: 'GENERATED' },
    })
  } else {
    await db.studioScene.update({ where: { id: sceneId }, data: { status: 'GENERATED' } })
  }

  for (let i = 0; i < scene.clips.length; i++) {
    const seg = segments[i]
    if (!seg) continue
    await db.studioClip.update({
      where: { sceneId_clipNumber: { sceneId, clipNumber: i + 1 } },
      data: { videoUrl: seg.videoUrl },
    })
  }

  await appendJobProgressEvent(
    jobId,
    { phase: 'complete', status: 'completed', detail: 'Scene complete', pct: 100 },
    {
      status: 'COMPLETE',
      progressPct: 100,
      outputUrl: segments[0]?.videoUrl,
      completedAt: new Date(),
    },
  )

  void sceneGroup
  void crossSceneAnchor
  void isFirstScene
}
