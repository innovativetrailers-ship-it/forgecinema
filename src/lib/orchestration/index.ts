// src/lib/orchestration/index.ts
// Main entry point for the 6-phase orchestration pipeline

import { extractNarrativeEntities, generatePatientZeroAssets } from './patientZero'
import { breakdownToShots, groupIntoChains }                    from './scriptBreakdown'
import { buildDAG, getTotalPlanCost }                            from './dagRouter'
import { generateStoryboard }                                   from './storyboard'
import { generateParallel }                                     from './parallelGeneration'
import { scoreSegment, repairSegment }                          from './qualityGate'
import { stitchSegments }                                       from './stitching'
import type { OrchestrationResult, PatientZeroAssets }           from './types'

export interface OrchestrationInput {
  prompt:         string
  totalDuration:  number
  selectedModels: string[]
  userId:         string
  onProgress?:    (phase: string, detail: string, progress: number) => void
}

export async function orchestrateGeneration(
  input: OrchestrationInput
): Promise<OrchestrationResult> {

  const { prompt, totalDuration, selectedModels, onProgress } = input
  const progress = (phase: string, detail: string, pct: number) =>
    onProgress?.(phase, detail, pct)

  // ── Phase 1: Patient Zero ────────────────────────────────────────────────
  progress('patient_zero', 'Extracting characters and locations...', 5)
  const entities = await extractNarrativeEntities(prompt)

  let patientZero: PatientZeroAssets = { characters: [], locations: [] }
  if (entities.characters.length > 0 || entities.locations.length > 0) {
    progress('patient_zero', 'Generating reference images...', 10)
    patientZero = await generatePatientZeroAssets(entities)
  }

  // ── Phase 2: Script breakdown ────────────────────────────────────────────
  progress('breakdown', 'Planning shot structure...', 20)
  const shots = await breakdownToShots(prompt, totalDuration, patientZero, selectedModels)

  // ── Phase 1.5: Storyboard keyframes (parallel pre-vis) ────────────────────
  progress('storyboard', 'Generating storyboard keyframes...', 25)
  const shotsWithKeyframes = await generateStoryboard(
    shots, patientZero,
    (done, total) => progress('storyboard', `Keyframe ${done}/${total}`, 25 + Math.round((done / total) * 10))
  )

  // Group into continuity chains (parallelisable units)
  const chains = groupIntoChains(shotsWithKeyframes)
  progress('routing', `Planning ${chains.length} parallel chains...`, 36)

  // ── Phase 3: DAG routing (with keyframed shots) ──────────────────────────
  const dag = buildDAG(shotsWithKeyframes, selectedModels)

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

  // ── Phase 4: PARALLEL generation across chains ───────────────────────────
  progress('generating', `Rendering ${chains.length} chains in parallel...`, 40)
  const segments = await generateParallel(
    chains,
    dag,
    patientZero,
    ({ shotIndex, totalShots, status, subMessage }) => {
      const pct = 40 + Math.round((shotIndex / Math.max(totalShots, 1)) * 45)
      const detail = subMessage ?? `Shot ${shotIndex + 1}/${totalShots}: ${status}`
      progress('generating', detail, pct)
    }
  )

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

  // ── Phase 6: Stitching ───────────────────────────────────────────────────
  progress('stitching', 'Assembling final film...', 94)
  const finalVideoUrl = segments.length === 1
    ? segments[0].videoUrl
    : await stitchSegments(segments, input.userId)

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
