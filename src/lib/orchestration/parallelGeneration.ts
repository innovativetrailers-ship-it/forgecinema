// src/lib/orchestration/parallelGeneration.ts
// Hybrid: parallel across continuity chains, sequential within each chain

import { callVideoModel, extractTailFrame, getModelTimeout, withTimeout } from './bridgedGeneration'
import { analyseFrameMotion, injectMotionContext }     from './opticalFlow'
import { continuityAgent, applyContinuity, type ContinuityState } from '@/lib/cognition/agents/continuityAgent'
import type { ContinuityChain, DAGNode, GeneratedSegment, PatientZeroAssets } from './types'

// Limit concurrent FAL calls so we don't hit rate limits — tune to your FAL plan
const MAX_PARALLEL_CHAINS = 4

type ChainProgressFn = (
  shotIndex: number,
  status:    string,
  sub?:      { pct: number; message: string }
) => void

async function generateChain(
  chain:      ContinuityChain,
  dagByIndex: Map<number, DAGNode>,
  assets:     PatientZeroAssets,
  onProgress: ChainProgressFn
): Promise<GeneratedSegment[]> {

  const results: GeneratedSegment[] = []
  let previousTail: string | undefined
  // Structured continuity (wardrobe/props/environment) carried forward as text,
  // complementing the visual tail-frame bridge. Best-effort: never blocks a render.
  let continuity: ContinuityState | null = null

  for (const shot of chain.shots) {
    const node = dagByIndex.get(shot.shotIndex)
    if (!node) continue
    onProgress(shot.shotIndex, 'generating')

    let prompt = shot.visualPrompt

    // First shot of chain → start from its storyboard keyframe (Frame Zero)
    // Subsequent shots in chain → start from previous shot's tail frame (continuity)
    let startFrame: string | undefined
    if (shot.isChainStart || !previousTail) {
      startFrame = shot.storyboardUrl          // Frame-Zero conditioning
    } else {
      startFrame = previousTail                 // tail-to-head bridge within chain
      try {
        const motion = await analyseFrameMotion(previousTail)
        prompt = injectMotionContext(prompt, motion, { contentType: shot.contentType, lighting: shot.lighting })
      } catch { /* non-fatal — proceed without motion context */ }
    }

    // Thread structured continuity state through the chain so wardrobe/props/setting
    // established in earlier shots survive into later cuts.
    try {
      continuity = await withTimeout(
        continuityAgent.execute({ shotPrompt: shot.visualPrompt, prior: continuity }),
        15_000,
        `Continuity shot ${shot.shotIndex}`,
      )
      prompt = applyContinuity(prompt, continuity)
    } catch { /* non-fatal — continuity is a best-effort enrichment */ }

    const characterRef = shot.charactersPresent.length > 0
      ? assets.characters.find(c => c.name === shot.charactersPresent[0])?.imageUrl
      : undefined

    const videoUrl = await withTimeout(
      callVideoModel({
        model:          node.assignedModel,
        prompt,
        duration:       shot.duration,
        imageUrl:       startFrame,
        patientZeroUrl: characterRef,
        onSubProgress:  (s) => onProgress(shot.shotIndex, 'generating', { pct: s.pct, message: s.message }),
      }),
      getModelTimeout(node.assignedModel),  // model-aware hard cap per segment
      `Shot ${shot.shotIndex} (${node.assignedModel})`
    )

    // Extract tail frame for the next shot IN THIS CHAIN only
    try { previousTail = await extractTailFrame(videoUrl) } catch { previousTail = undefined }

    results.push({
      shotIndex:    shot.shotIndex,
      videoUrl,
      duration:     shot.duration,
      model:        node.assignedModel,
      contentType:  shot.contentType,
      tailFrameUrl: previousTail ?? '',
      qualityScore: 1.0,
      retryCount:   0,
    })
    onProgress(shot.shotIndex, 'complete')
  }

  return results
}

// Run all chains in parallel (bounded by MAX_PARALLEL_CHAINS)
export async function generateParallel(
  chains:     ContinuityChain[],
  dag:        DAGNode[],
  assets:     PatientZeroAssets,
  onProgress: (data: { shotIndex: number; totalShots: number; status: string; subProgress?: number; subMessage?: string }) => void
): Promise<GeneratedSegment[]> {

  const dagByIndex = new Map(dag.map(n => [n.shot.shotIndex, n]))
  const totalShots = dag.length
  const all: GeneratedSegment[] = []

  // Process chains in parallel batches
  for (let i = 0; i < chains.length; i += MAX_PARALLEL_CHAINS) {
    const batch = chains.slice(i, i + MAX_PARALLEL_CHAINS)
    const batchResults = await Promise.all(
      batch.map(chain =>
        generateChain(chain, dagByIndex, assets, (shotIndex, status, sub) =>
          onProgress({
            shotIndex, totalShots, status,
            subProgress: sub?.pct,
            subMessage:  sub ? `Shot ${shotIndex + 1}/${totalShots}: ${sub.message}` : undefined,
          })
        )
      )
    )
    batchResults.forEach(r => all.push(...r))
  }

  return all.sort((a, b) => a.shotIndex - b.shotIndex)
}
