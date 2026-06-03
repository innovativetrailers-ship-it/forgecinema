// src/lib/orchestration/dagRouter.ts
// Deterministic model assignment — no LLM guessing, explicit scoring matrix

import { MODEL_COSTS } from '@/lib/routing/engineRegistry'
import { getHealthyModels, scoreModelsLive } from '@/lib/cognition/routing/performance'
import { getLearnedBestModel } from '@/lib/cognition/memory/procedural'
import type { StructuredShot, DAGNode } from './types'

const CONTENT_ROUTING: Record<string, string[]> = {
  aerial_establishing:  ['luma-ray3',         'veo-3.1',            'wan-2.2'],
  dialogue_closeup:     ['happyhorse-1.0',     'seedance-2.0',       'kling-3.0',          'minimax-2.3'],
  physical_action:      ['kling-3.0',          'grok-imagine-video', 'seedance-2.0'],
  cgi_vfx:             ['pixverse-c1',         'veo-3.1',            'hunyuan-video-1.5'],
  crowd_urban:          ['hunyuan-video-1.5',  'kling-3.0',          'veo-3.1'],
  camera_control:       ['runway-gen4',        'pixverse-v6',        'kling-3.0'],
  physics_simulation:   ['sora-2',             'veo-3.1',            'pixverse-c1',        'minimax-2.3'],
  character_emotion:    ['kling-o3',           'seedance-2.0',       'minimax-2.3',        'kling-3.0'],
  cgi_character:        ['hunyuan-hy-motion',  'hailuo-2.3',         'kling-3.0',          'veo-3.1'],
  long_sequence:        ['skyreels-v3',        'minimax-2.3',        'wan-2.2'],
  fast_draft:           ['ltx-2.3-fast',       'ltx-2.3',            'wan-2.2'],   // LTX fast preferred; Wan demoted (slow on FAL)
  environment_travel:   ['luma-ray3',          'ltx-2.3',            'wan-2.2'],   // Wan demoted to last-resort fallback
  product_commercial:   ['pika-2.5',           'runway-gen4',        'kling-3.0'],
  audio_native:         ['veo-3.1',            'grok-imagine-video', 'seedance-2.0'],
}

// Deterministic baseline assignment — no DB, always works. Used directly when
// cognitive routing is unavailable, and as the final fallback within it.
function selectModelStatic(
  shot: StructuredShot & { suggestedModel?: string },
  availablePool: string[]
): string {
  if (shot.suggestedModel && availablePool.includes(shot.suggestedModel)) {
    return shot.suggestedModel
  }
  const preferences = CONTENT_ROUTING[shot.contentType] ?? ['ltx-2.3-fast']
  for (const model of preferences) {
    if (availablePool.includes(model)) return model
  }
  const byPrice = [...availablePool].sort(
    (a, b) => (MODEL_COSTS[a] ?? 99) - (MODEL_COSTS[b] ?? 99)
  )
  return byPrice[0] ?? 'ltx-2.3-fast'
}

// Cognition-aware selection: circuit breaker → learned policy → live performance,
// falling back to the static matrix. Wrapped so a missing/unreachable cognition DB
// degrades to deterministic routing rather than failing the render.
async function selectModel(
  shot: StructuredShot & { suggestedModel?: string },
  availablePool: string[]
): Promise<string> {
  try {
    const healthy = await getHealthyModels(availablePool)
    const pool = healthy.length ? healthy : availablePool

    // Priority 0: Claude's pool-aware suggestion (if healthy)
    if (shot.suggestedModel && pool.includes(shot.suggestedModel)) return shot.suggestedModel

    // Priority 0.5 / 0.7: learned historical policy blended with live performance
    const [learned, liveScores] = await Promise.all([
      getLearnedBestModel(shot.contentType, pool),
      scoreModelsLive(pool),
    ])

    const candidates = (CONTENT_ROUTING[shot.contentType] ?? []).filter(m => pool.includes(m))
    if (candidates.length) {
      const best = candidates.sort((a, b) => (liveScores[b] ?? 0.5) - (liveScores[a] ?? 0.5))[0]
      // Prefer the learned best if it is healthy and within 10% of the live leader
      if (learned && (liveScores[learned] ?? 0) > (liveScores[best] ?? 0) * 0.9) return learned
      return best
    }

    return learned ?? selectModelStatic(shot, pool)
  } catch (err) {
    console.warn('[dagRouter] live routing degraded → static matrix:', err instanceof Error ? err.message : String(err))
    return selectModelStatic(shot, availablePool)
  }
}

function estimateShotCost(model: string, duration: number): number {
  const ratePerFive = MODEL_COSTS[model] ?? 2
  return Math.ceil((ratePerFive / 5) * duration)
}

export async function buildDAG(
  shots:         StructuredShot[],
  availablePool: string[]
): Promise<DAGNode[]> {
  const nodes: DAGNode[] = []
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i]
    const model = await selectModel(shot, availablePool)
    nodes.push({
      shot,
      assignedModel:  model,
      dependencies:   i > 0 ? [i - 1] : [],
      tailFrameUrl:   undefined,
      shotMemory:     [],
      estimatedCost:  estimateShotCost(model, shot.duration),
      priority:       shot.hasDialogue || shot.hasFaces ? 'critical' : 'normal',
    })
  }
  return nodes
}

export function getTotalPlanCost(dag: DAGNode[]): number {
  return dag.reduce((sum, node) => sum + node.estimatedCost, 0)
}
