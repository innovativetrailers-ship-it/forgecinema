// src/lib/orchestration/chainGeneration.ts
// Chains run in parallel across continuity groups; clips within each chain are strictly sequential.

import { consumeFromHold } from '@/lib/credits/escrow'
import { assertBudgetForSegment, onPermanentSegmentFailure } from './budget'
import { loadCheckpoint, saveCheckpoint } from './checkpoints'
import { buildChainForScene, groupIntoScenes } from './chainBuilder'
import { resolveStartFrame } from './anchorPolicy'
import { callVideoModel, extractTailFrame, getModelTimeout, withTimeout } from './bridgedGeneration'
import type { GenerationMode } from './costGuard'
import { analyseFrameMotion, injectMotionContext }     from './opticalFlow'
import { continuityAgent, applyContinuity, type ContinuityState } from '@/lib/cognition/agents/continuityAgent'
import type { ContinuityChain, DAGNode, GeneratedSegment, PatientZeroAssets, StructuredShot } from './types'

const MAX_PARALLEL_CHAINS = 4 // legacy parallel path only

export class CanaryFailure extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CanaryFailure'
  }
}

type ChainProgressFn = (
  shotIndex: number,
  status:    string,
  sub?:      { pct: number; message: string }
) => void

function segmentIdForShot(shotIndex: number): string {
  return `shot-${shotIndex}`
}

function chainCost(chain: ContinuityChain, dagByIndex: Map<number, DAGNode>): number {
  return chain.shots.reduce((sum, shot) => {
    const node = dagByIndex.get(shot.shotIndex)
    return sum + (node?.estimatedCost ?? 2)
  }, 0)
}

async function generateShot(
  shot:           StructuredShot,
  node:           DAGNode,
  assets:         PatientZeroAssets,
  anchorFrameUrl: string | undefined,
  continuity:     ContinuityState | null,
  onProgress:     ChainProgressFn,
  jobId:          string | undefined,
  onPoll:         (() => void | Promise<void>) | undefined,
  generationMode: GenerationMode,
  projectId?:     string,
): Promise<{ segment: GeneratedSegment; lastFrame: string | undefined; continuity: ContinuityState | null }> {
  const segId = segmentIdForShot(shot.shotIndex)

  if (jobId) {
    const existing = await loadCheckpoint(jobId, segId)
    if (existing?.qaPassed) {
      const lastFrame = existing.anchorFrame ?? undefined
      return {
        segment: {
          shotIndex:    shot.shotIndex,
          videoUrl:     existing.videoUrl,
          duration:     shot.duration,
          model:        existing.modelUsed,
          contentType:  shot.contentType,
          tailFrameUrl: lastFrame ?? '',
          qualityScore: 1.0,
          retryCount:   0,
        },
        lastFrame,
        continuity,
      }
    }
  }

  onProgress(shot.shotIndex, 'generating')

  if (projectId) {
    const { markBatchClipGenerating } = await import('@/lib/studio/batchClipSync')
    await markBatchClipGenerating(projectId, shot.shotIndex).catch(() => {})
  }

  if (jobId) {
    await assertBudgetForSegment(jobId, node.estimatedCost)
  }

  const rawPrompt = (shot.visualPrompt ?? (shot as { prompt?: string }).prompt ?? '').trim()
  if (!rawPrompt || rawPrompt.length < 3) {
    throw new Error(
      `Shot ${shot.shotIndex}: visualPrompt is empty or missing — check script breakdown`,
    )
  }
  let prompt = rawPrompt

  const anchorCtx = {
    isVeryFirstClipOfFilm: shot.isChainStart === true && !anchorFrameUrl && !shot.startsAtHardCut,
  }
  const startFrame = resolveStartFrame(shot, anchorFrameUrl, anchorCtx)
  if (startFrame && startFrame === anchorFrameUrl && anchorFrameUrl) {
    try {
      const motion = await analyseFrameMotion(anchorFrameUrl)
      prompt = injectMotionContext(prompt, motion, { contentType: shot.contentType, lighting: shot.lighting })
    } catch { /* non-fatal */ }
  }

  let nextContinuity = continuity
  try {
    nextContinuity = await withTimeout(
      continuityAgent.execute({ shotPrompt: shot.visualPrompt, prior: continuity }),
      15_000,
      `Continuity shot ${shot.shotIndex}`,
    )
    prompt = applyContinuity(prompt, nextContinuity)
  } catch { /* non-fatal */ }

  const characterRef = shot.charactersPresent.length > 0
    ? assets.characters.find(c => c.name === shot.charactersPresent[0])?.imageUrl
    : undefined

  let videoUrl: string
  try {
    videoUrl = await withTimeout(
      callVideoModel({
        model:          node.assignedModel,
        prompt,
        duration:       shot.duration,
        imageUrl:       startFrame,
        patientZeroUrl: characterRef,
        jobId,
        shotIndex:      shot.shotIndex,
          generationMode,
          onSubProgress:  (s) => onProgress(shot.shotIndex, 'generating', { pct: s.pct, message: s.message }),
        onPoll,
      }),
      getModelTimeout(node.assignedModel),
      `Shot ${shot.shotIndex} (${node.assignedModel})`,
    )
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    if (projectId) {
      const { markBatchClipFailed } = await import('@/lib/studio/batchClipSync')
      await markBatchClipFailed(projectId, shot.shotIndex).catch(() => {})
    }
    if (jobId) {
      await onPermanentSegmentFailure(jobId, shot.shotIndex, reason)
    }
    throw err
  }

  let lastFrame: string | undefined
  try {
    lastFrame = await extractTailFrame(videoUrl)
    if (lastFrame) {
      const { falLog } = await import('@/lib/fal/falQueue')
      falLog('info', 'anchor_extracted', {
        shotIndex: shot.shotIndex,
        jobId,
        lastFrame: lastFrame.slice(0, 80),
      })
    }
  } catch (err) {
    const { falLog } = await import('@/lib/fal/falQueue')
    falLog('warn', 'anchor_extract_failed', {
      shotIndex: shot.shotIndex,
      jobId,
      error: err instanceof Error ? err.message : String(err),
      note: 'Next shot will generate without start frame anchor',
    })
    lastFrame = undefined
  }

  if (jobId) {
    try {
      await saveCheckpoint({
        jobId,
        segmentId: segId,
        shotId: shot.shotIndex,
        videoUrl,
        modelUsed: node.assignedModel,
        cost: node.estimatedCost,
        qaPassed: true,
        anchorFrame: lastFrame,
      })
      await consumeFromHold(jobId, segId, node.estimatedCost)
    } catch (err) {
      const { falLog } = await import('@/lib/fal/falQueue')
      falLog('warn', 'checkpoint_save_failed', {
        shotIndex: shot.shotIndex,
        jobId,
        error: err instanceof Error ? err.message : String(err),
        note: 'Continuing — shot completed but checkpoint may not resume',
      })
    }
  }

  if (projectId) {
    const { markBatchClipCompleted } = await import('@/lib/studio/batchClipSync')
    await markBatchClipCompleted(projectId, shot.shotIndex, videoUrl, lastFrame).catch(() => {})
  }

  return {
    segment: {
      shotIndex:    shot.shotIndex,
      videoUrl,
      duration:     shot.duration,
      model:        node.assignedModel,
      contentType:  shot.contentType,
      tailFrameUrl: lastFrame ?? '',
      qualityScore: 1.0,
      retryCount:   0,
    },
    lastFrame,
    continuity: nextContinuity,
  }
}

/** Sequential clip dispatch — each shot awaits the prior shot's tail frame. */
async function generateChain(
  chain:          ContinuityChain,
  dagByIndex:     Map<number, DAGNode>,
  assets:         PatientZeroAssets,
  onProgress:     ChainProgressFn,
  jobId?:         string,
  onPoll?:        () => void | Promise<void>,
  generationMode: GenerationMode = 'draft',
): Promise<GeneratedSegment[]> {

  const results: GeneratedSegment[] = []
  let anchorFrameUrl: string | undefined
  let continuity: ContinuityState | null = null

  for (const shot of chain.shots) {
    const node = dagByIndex.get(shot.shotIndex)
    if (!node) continue

    const { segment, lastFrame, continuity: updated } = await generateShot(
      shot, node, assets, anchorFrameUrl, continuity, onProgress, jobId, onPoll, generationMode,
    )
    anchorFrameUrl = lastFrame
    continuity = updated
    results.push(segment)
    onProgress(shot.shotIndex, 'complete')
  }

  return results
}

/** Sequential scene loop — scenes and clips run one at a time with cross-scene anchors. */
export async function generateAllScenes(
  shots:      StructuredShot[],
  dag:        DAGNode[],
  assets:     PatientZeroAssets,
  onProgress: (data: { shotIndex: number; totalShots: number; status: string; subProgress?: number; subMessage?: string }) => void,
  options?:   {
    jobId?:           string
    projectId?:       string
    onPoll?:          () => void | Promise<void>
    onPhase?:         (phase: string, detail: string) => void
    generationMode?:  GenerationMode
    selectedModels?:  string[]
  },
): Promise<GeneratedSegment[]> {
  const dagByIndex = new Map(dag.map((n) => [n.shot.shotIndex, n]))
  const totalShots = dag.length
  const all: GeneratedSegment[] = []
  const jobId = options?.jobId
  const projectId = options?.projectId
  const onPoll = options?.onPoll
  const generationMode = options?.generationMode ?? 'draft'
  const selectedModels = options?.selectedModels ?? dag.map((n) => n.assignedModel)

  if (projectId) {
    const { invalidateBatchClipCache } = await import('@/lib/studio/batchClipSync')
    invalidateBatchClipCache(projectId)
  }

  const scenes = groupIntoScenes(shots)
  let crossSceneAnchor: string | undefined
  let globalShot = 0

  for (let s = 0; s < scenes.length; s++) {
    const scene = scenes[s]
    const isFirstScene = s === 0
    options?.onPhase?.(
      `scene_${scene.sceneNumber}_start`,
      `Generating scene ${scene.sceneNumber} of ${scenes.length}`,
    )

    const modelByShot = new Map(dag.map((n) => [n.shot.shotIndex, n.assignedModel]))
    const chain = buildChainForScene(
      scene,
      selectedModels,
      modelByShot,
      crossSceneAnchor,
      isFirstScene,
    )

    const { logChainBuilt } = await import('@/lib/studio/shotPlan')
    logChainBuilt(scene.sceneNumber, scene.sceneId, chain)

    let anchorFrameUrl: string | undefined = isFirstScene ? undefined : crossSceneAnchor
    let continuity: ContinuityState | null = null

    const SCENE_TIMEOUT_MS = 30 * 60 * 1000
    await withTimeout((async () => {
    for (let i = 0; i < chain.length; i++) {
      const clip = chain[i]
      const shot = scene.shots[i]
      const node = dagByIndex.get(shot.shotIndex)
      if (!node) continue

      const isVeryFirst = isFirstScene && i === 0
      const injectedStart = !isVeryFirst && i === 0 ? crossSceneAnchor : clip.startFrameUrl
      if (injectedStart && !anchorFrameUrl) anchorFrameUrl = injectedStart

      const patchedShot: StructuredShot = {
        ...shot,
        isChainStart: isVeryFirst,
        startsAtHardCut: isVeryFirst,
      }

      const progressWrapper: ChainProgressFn = (shotIndex, status, sub) => {
        onProgress({
          shotIndex: globalShot,
          totalShots,
          status,
          subProgress: sub?.pct,
          subMessage: sub
            ? `Scene ${scene.sceneNumber} · shot ${shotIndex + 1}/${totalShots}: ${sub.message}`
            : undefined,
        })
      }

      const { segment, lastFrame, continuity: updated } = await generateShot(
        patchedShot,
        node,
        assets,
        anchorFrameUrl,
        continuity,
        progressWrapper,
        jobId,
        onPoll,
        generationMode,
        projectId,
      )
      anchorFrameUrl = lastFrame
      continuity = updated
      all.push(segment)
      globalShot++
      onProgress({ shotIndex: globalShot - 1, totalShots, status: 'complete' })
    }
    })(), SCENE_TIMEOUT_MS, `Scene ${scene.sceneNumber}`)

    if (anchorFrameUrl) {
      crossSceneAnchor = anchorFrameUrl
      if (jobId) {
        const { saveCheckpoint } = await import('./checkpoints')
        await saveCheckpoint({
          jobId,
          segmentId: `scene_anchor_${scene.sceneNumber}`,
          shotId: scene.shots[scene.shots.length - 1]?.shotIndex ?? 0,
          videoUrl: anchorFrameUrl,
          modelUsed: 'anchor',
          cost: 0,
          qaPassed: true,
          anchorFrame: anchorFrameUrl,
        })
      }
    }

    options?.onPhase?.(
      `scene_${scene.sceneNumber}_complete`,
      `Scene ${scene.sceneNumber}/${scenes.length} complete`,
    )
  }

  return all.sort((a, b) => a.shotIndex - b.shotIndex)
}

/** @deprecated Use generateAllScenes — parallel chains violate sequential scene policy. */
export async function generateParallel(
  chains:     ContinuityChain[],
  dag:        DAGNode[],
  assets:     PatientZeroAssets,
  onProgress: (data: { shotIndex: number; totalShots: number; status: string; subProgress?: number; subMessage?: string }) => void,
  options?:   {
    jobId?:           string
    onPoll?:          () => void | Promise<void>
    onPhase?:         (phase: string, detail: string) => void
    generationMode?:  GenerationMode
  },
): Promise<GeneratedSegment[]> {

  const dagByIndex = new Map(dag.map(n => [n.shot.shotIndex, n]))
  const totalShots = dag.length
  const all: GeneratedSegment[] = []
  const jobId = options?.jobId
  const onPoll = options?.onPoll
  const generationMode = options?.generationMode ?? 'draft'

  const progressWrapper = (chain: ContinuityChain) =>
    (shotIndex: number, status: string, sub?: { pct: number; message: string }) =>
      onProgress({
        shotIndex, totalShots, status,
        subProgress: sub?.pct,
        subMessage:  sub ? `Shot ${shotIndex + 1}/${totalShots}: ${sub.message}` : undefined,
      })

  const sorted = [...chains].sort((a, b) => chainCost(a, dagByIndex) - chainCost(b, dagByIndex))
  const canary = sorted[0]
  const rest   = sorted.slice(1)

  if (canary) {
    const firstShot = canary.shots[0]?.shotIndex ?? 0
    options?.onPhase?.('canary_start', `Validating pipeline with shot ${firstShot + 1}`)
    try {
      const canaryResults = await generateChain(
        canary, dagByIndex, assets, progressWrapper(canary), jobId, onPoll, generationMode,
      )
      all.push(...canaryResults)
    } catch (err) {
      if (err instanceof Error && err.name === 'NeedsAttentionError') throw err
      throw new CanaryFailure(
        `Pipeline validation failed on cheapest shot: ${err instanceof Error ? err.message : String(err)}`,
      )
    }
    options?.onPhase?.('canary_passed', 'Pipeline validated — generating remaining shots')
  }

  for (const chain of rest) {
    const chainResults = await generateChain(
      chain, dagByIndex, assets, progressWrapper(chain), jobId, onPoll, generationMode,
    )
    all.push(...chainResults)
  }

  return all.sort((a, b) => a.shotIndex - b.shotIndex)
}
