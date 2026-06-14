// src/lib/orchestration/index.ts
// Main entry point for the 6-phase orchestration pipeline

import { db } from '@/lib/db'
import { openHold } from '@/lib/credits/escrow'
import { extractNarrativeEntities, generatePatientZeroAssets } from './patientZero'
import { breakdownToShots }                                     from './scriptBreakdown'
import { buildDAG, getTotalPlanCost }                            from './dagRouter'
import { generateStoryboard }                                   from './storyboard'
import { generateAllScenes }                                    from './chainGeneration'
import { extractDialogueForShots }                              from './dialogueExtractor'
import { generateVoiceLines }                                   from '@/lib/audio/dialoguePipeline'
import { runLipSyncPass }                                       from './lipSyncPass'
import { assembleAudio }                                        from '@/lib/audio/audioAssembly'
import { syncScenesFromShots }                                  from '@/lib/studio/sceneSync'
import { buildSceneStyleAnchors, injectStyleAnchor }            from './sceneStyleAnchors'
import { runBoundaryQA }                                        from './boundaryQA'
import { scoreSegment, repairSegment }                          from './qualityGate'
import { stitchSegments }                                       from './stitching'
import { preflight, PreflightError }                            from './preflight'
import { resolveFalVideoEndpoint }                              from './falEndpoints'
import { TIER_BUDGET_CAPS }                                     from './budget'
import type { GenerationMode } from './costGuard'
import type { OrchestrationResult, PatientZeroAssets }           from './types'

export interface OrchestrationInput {
  prompt:          string
  totalDuration:   number
  selectedModels:  string[]
  userId:          string
  jobId?:          string
  projectId?:      string
  musicUrl?:       string
  ambienceUrl?:    string
  generationMode?: GenerationMode
  heartbeat?:      () => void | Promise<void>
  onProgress?:     (phase: string, detail: string, progress: number) => void
}

export { PreflightError } from './preflight'

export async function orchestrateGeneration(
  input: OrchestrationInput
): Promise<OrchestrationResult> {

  const { prompt, totalDuration, selectedModels, onProgress, jobId } = input
  const generationMode: GenerationMode = input.generationMode ?? 'draft'
  const progress = (phase: string, detail: string, pct: number) =>
    onProgress?.(phase, detail, pct)

  const script = prompt?.trim() ?? ''
  if (script.length < 10) {
    throw new Error(
      `[orchestrate] Job ${jobId ?? 'inline'} has no script — pass current editor content as prompt`,
    )
  }

  if (jobId) {
    const { clearDecompositionCheckpoint } = await import('./checkpoints')
    await clearDecompositionCheckpoint(jobId)
  }

  if (!selectedModels?.length) {
    throw new Error('[orchestrate] selectedModels is empty — council selection required')
  }
  console.log(`[orchestrate] DAG model pool (job ${jobId ?? 'inline'}):`, selectedModels)

  const { assertFalAccountUnlocked } = await import('@/lib/fal/accountStatus')
  const modelEndpoints = selectedModels
    .map((m) => resolveFalVideoEndpoint(m, 't2v'))
    .filter((ep): ep is string => Boolean(ep))
  // Probe only council-selected video endpoints + storyboard image model (not full tier defaults).
  const probeSet = [...new Set(['fal-ai/gemini-25-flash-image', ...modelEndpoints])]
  await assertFalAccountUnlocked(probeSet)
  progress('preflight', 'fal.ai account ready', 3)

  // ── Phase 1: Patient Zero ────────────────────────────────────────────────
  progress('patient_zero', 'Extracting characters and locations...', 5)
  const entities = await extractNarrativeEntities(script)

  let patientZero: PatientZeroAssets = { characters: [], locations: [] }
  if (entities.characters.length > 0 || entities.locations.length > 0) {
    progress('patient_zero', 'Generating reference images...', 10)
    patientZero = await generatePatientZeroAssets(entities)
  }

  // ── Phase 2: Script breakdown ────────────────────────────────────────────
  progress('breakdown', 'Planning shot structure...', 20)
  const shots = await breakdownToShots(script, totalDuration, patientZero, selectedModels)

  if (jobId) {
    const { saveDecompositionCheckpoint } = await import('./checkpoints')
    await saveDecompositionCheckpoint(jobId, shots)
  }

  // ── Phase 1.5: Storyboard keyframes (parallel pre-vis) ────────────────────
  progress('storyboard', 'Generating storyboard keyframes...', 25)
  const shotsWithKeyframes = await generateStoryboard(shots, patientZero, {
    jobId: input.jobId,
    onPoll: input.heartbeat,
    onProgress: (done, total, detail) =>
      progress('storyboard', detail ?? `Keyframe ${done}/${total}`, 25 + Math.round((done / total) * 10)),
  })

  const { groupIntoScenes } = await import('./chainBuilder')
  const sceneGroups = groupIntoScenes(shotsWithKeyframes)
  progress('routing', `Planning ${sceneGroups.length} sequential scenes...`, 36)

  if (input.projectId) {
    await syncScenesFromShots(input.projectId, shotsWithKeyframes).catch(() => {})
  }

  // ── Phase 3: DAG routing (with keyframed shots) ──────────────────────────
  const dag = await buildDAG(shotsWithKeyframes, selectedModels)

  const totalCredits = getTotalPlanCost(dag)

  const modelBreakdown: OrchestrationResult['modelBreakdown'] = {}
  for (const node of dag) {
    if (!modelBreakdown[node.assignedModel]) {
      modelBreakdown[node.assignedModel] = { duration: 0, cost: 0, shots: [] }
    }
    modelBreakdown[node.assignedModel].duration += node.shot.duration
    modelBreakdown[node.assignedModel].cost     += node.estimatedCost
    modelBreakdown[node.assignedModel].shots.push(node.shot.shotIndex)
  }

  const styleAnchors = await buildSceneStyleAnchors(shotsWithKeyframes, patientZero)
  for (const shot of shotsWithKeyframes) {
    const anchor = injectStyleAnchor(shot, styleAnchors)
    if (anchor && !shot.storyboardUrl) shot.storyboardUrl = anchor
  }

  // ── Layer 0: Preflight gate (before paid video generation) ───────────────
  const user = await db.user.findUnique({
    where: { id: input.userId },
    select: { creditBalance: true, role: true, subscriptionTier: true },
  })
  const userCredits = user?.role === 'ADMIN' ? 9_999_999 : (user?.creditBalance ?? 0)
  const pf = await preflight({
    dag,
    shots: shotsWithKeyframes,
    patientZero,
    userCredits,
  })
  if (!pf.pass) {
    progress('preflight_failed', pf.errors.map((e) => e.detail).join('\n'), 38)
    throw new PreflightError(pf.errors)
  }
  progress('preflight_passed', `Estimated cost: ${pf.estimate.credits} credits`, 39)

  // ── Layer 1: Escrow hold (after preflight, before generation) ────────────
  if (input.jobId) {
    const tier = user?.role === 'ADMIN'
      ? 'admin'
      : (user?.subscriptionTier?.toLowerCase() ?? 'free')
    const budgetCap = TIER_BUDGET_CAPS[tier] ?? TIER_BUDGET_CAPS.free
    const held = await openHold(input.userId, input.jobId, pf.estimate.credits, budgetCap)
    await db.renderJob.update({
      where: { id: input.jobId },
      data: { creditsCharged: held },
    }).catch(() => {})
  }

  const dialogueMapPromise = extractDialogueForShots(shotsWithKeyframes, input.projectId)

  // ── Phase 3: Sequential scene generation (clips chain within each scene) ─
  progress('generating', `Rendering ${sceneGroups.length} scenes sequentially...`, 40)
  let segments = await generateAllScenes(
    shotsWithKeyframes,
    dag,
    patientZero,
    ({ shotIndex, totalShots, status, subMessage }) => {
      const pct = 40 + Math.round((shotIndex / Math.max(totalShots, 1)) * 40)
      const detail = subMessage ?? `Shot ${shotIndex + 1}/${totalShots}: ${status}`
      progress('generating', detail, pct)
    },
    {
      jobId: input.jobId,
      projectId: input.projectId,
      onPoll: input.heartbeat,
      generationMode,
      selectedModels,
      onPhase: (phase, detail) => progress(phase, detail, 42),
    },
  )

  // ── Phase 3B–4: ElevenLabs voice + lip sync ───────────────────────────────
  await dialogueMapPromise
  if (input.jobId && input.projectId) {
    progress('voice', 'Generating dialogue (ElevenLabs)...', 82)
    await generateVoiceLines(input.projectId, input.jobId)
    progress('lipsync', 'Running lip sync pass...', 84)
    segments = await runLipSyncPass(
      segments,
      input.projectId,
      input.jobId,
      generationMode,
      (d) => progress('lipsync', d, 85),
    )
  }

  progress('quality_gate', 'Checking segment boundaries...', 86)
  const shotPrompts = new Map(shotsWithKeyframes.map((s) => [s.shotIndex, s.visualPrompt]))
  segments = await runBoundaryQA(segments, shotPrompts)

  // ── Phase 5: Quality gate + Meta-Planner repair ──────────────────────────
  progress('quality_gate', 'Scoring and repairing segments...', 86)
  const qualityScores: Record<number, number> = {}
  for (const seg of segments) {
    const shot  = shotsWithKeyframes.find(s => s.shotIndex === seg.shotIndex) ?? shotsWithKeyframes[seg.shotIndex]
    const score = await scoreSegment(seg.videoUrl, shot.hasFaces)
    qualityScores[seg.shotIndex] = score.overall
    seg.qualityScore = score.overall

    // Meta-Planner: repair sub-threshold segments by re-anchoring to storyboard
    if (!score.passed && shot.storyboardUrl) {
      progress('quality_gate', `Repairing shot ${seg.shotIndex + 1}...`, 88)
      const repaired = await repairSegment(
        seg.videoUrl, shot.storyboardUrl, shot.visualPrompt, seg.model, shot.duration
      )
      if (repaired) seg.videoUrl = repaired
    }
  }

  // ── Phase 5: Stitching ───────────────────────────────────────────────────
  progress('stitching', 'Assembling final film...', 92)
  let finalVideoUrl = segments.length === 1
    ? segments[0].videoUrl
    : await stitchSegments(segments, input.userId)

  // ── Phase 6: Audio assembly (data-driven AudioTrack mix) ─────────────────
  if (input.jobId && input.projectId) {
    const trackCount = await db.audioTrack.count({
      where: { projectId: input.projectId, status: 'READY', muted: false },
    })
    if (trackCount > 0) {
      progress('audio_mix', 'Mixing soundtrack...', 96)
      const { computeShotOffsets } = await import('@/lib/audio/shotOffsets')
      const { listShotPlan } = await import('@/lib/studio/shotPlan')
      const { shots: planShots } = await listShotPlan(input.projectId)
      const clipIdByIndex = new Map(planShots.map((s) => [s.shotNumber - 1, s.id]))

      const placed = segments.map((seg) => ({
        shotId: seg.shotId ?? clipIdByIndex.get(seg.shotIndex) ?? `shot-${seg.shotIndex}`,
        shotIndex: seg.shotIndex,
        videoUrl: seg.videoUrl,
      }))
      const shotOffsets = await computeShotOffsets(placed)
      const { assembleAudioFromUrl } = await import('@/lib/audio/audioAssembly')
      finalVideoUrl = await assembleAudioFromUrl({
        projectId: input.projectId,
        videoUrl: finalVideoUrl,
        shotOffsets,
        jobId: input.jobId,
      })
    }
  }

  progress('complete', 'Film complete', 100)

  return {
    segments,
    finalVideoUrl,
    totalCredits,
    totalDuration,
    qualityScores,
    modelBreakdown,
    patientZero,
  }
}

export { getTotalPlanCost, buildDAG }  from './dagRouter'
export { breakdownToShots }            from './scriptBreakdown'
export type { OrchestrationResult }    from './types'
