// src/lib/orchestration/index.ts
// Main entry point for the 6-phase orchestration pipeline

import { extractNarrativeEntities, generatePatientZeroAssets } from './patientZero'
import { breakdownToShots }                                      from './scriptBreakdown'
import { buildDAG, getTotalPlanCost }                            from './dagRouter'
import { generateWithBridging }                                  from './bridgedGeneration'
import { scoreSegment }                                          from './qualityGate'
import { stitchSegments }                                        from './stitching'
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

  // ── Phase 3: DAG routing ─────────────────────────────────────────────────
  progress('routing', 'Assigning models to shots...', 30)
  const dag = buildDAG(shots, selectedModels)

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

  // ── Phase 4: Bridged generation ──────────────────────────────────────────
  progress('generating', 'Generating segments...', 40)
  const segments = await generateWithBridging(
    dag,
    patientZero,
    (shotIdx, status) => {
      const pct = 40 + Math.round((shotIdx / shots.length) * 50)
      progress('generating', `Shot ${shotIdx + 1}/${shots.length}: ${status}`, pct)
    }
  )

  // ── Phase 5: Quality gate ────────────────────────────────────────────────
  progress('quality_gate', 'Scoring segments...', 88)
  const qualityScores: Record<number, number> = {}
  for (const seg of segments) {
    const shot  = shots[seg.shotIndex]
    const score = await scoreSegment(seg.videoUrl, shot.hasFaces)
    qualityScores[seg.shotIndex] = score.overall
    seg.qualityScore = score.overall
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
