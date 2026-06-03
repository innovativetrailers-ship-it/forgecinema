// src/lib/orchestration/dagRouter.ts
// Deterministic model assignment — no LLM guessing, explicit scoring matrix

import { MODEL_COSTS } from '@/lib/routing/engineRegistry'
import type { StructuredShot, DAGNode } from './types'

const CONTENT_ROUTING: Record<string, string[]> = {
  aerial_establishing:  ['luma-ray3',         'veo-3.1',            'wan-2.2'],
  dialogue_closeup:     ['seedance-2.0',       'kling-3.0',          'minimax-2.3'],
  physical_action:      ['kling-3.0',          'grok-imagine-video', 'seedance-2.0'],
  cgi_vfx:             ['pixverse-c1',         'veo-3.1',            'hunyuan-video-1.5'],
  crowd_urban:          ['hunyuan-video-1.5',  'kling-3.0',          'veo-3.1'],
  camera_control:       ['runway-gen4',        'pixverse-v6',        'kling-3.0'],
  physics_simulation:   ['veo-3.1',            'pixverse-c1',        'minimax-2.3'],
  character_emotion:    ['seedance-2.0',       'minimax-2.3',        'kling-3.0'],
  cgi_character:        ['hunyuan-hy-motion',  'kling-3.0',          'veo-3.1'],
  long_sequence:        ['skyreels-v3',        'minimax-2.3',        'wan-2.2'],
  fast_draft:           ['ltx-2.3-fast',       'ltx-2.3',            'wan-2.2'],   // LTX fast preferred; Wan demoted (slow on FAL)
  environment_travel:   ['luma-ray3',          'ltx-2.3',            'wan-2.2'],   // Wan demoted to last-resort fallback
  product_commercial:   ['pika-2.5',           'runway-gen4',        'kling-3.0'],
  audio_native:         ['veo-3.1',            'grok-imagine-video', 'seedance-2.0'],
}

function selectModel(
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

function estimateShotCost(model: string, duration: number): number {
  const ratePerFive = MODEL_COSTS[model] ?? 2
  return Math.ceil((ratePerFive / 5) * duration)
}

export function buildDAG(
  shots:         StructuredShot[],
  availablePool: string[]
): DAGNode[] {
  return shots.map((shot, i) => {
    const model = selectModel(shot, availablePool)
    return {
      shot,
      assignedModel:  model,
      dependencies:   i > 0 ? [i - 1] : [],
      tailFrameUrl:   undefined,
      shotMemory:     [],
      estimatedCost:  estimateShotCost(model, shot.duration),
      priority:       shot.hasDialogue || shot.hasFaces ? 'critical' : 'normal',
    }
  })
}

export function getTotalPlanCost(dag: DAGNode[]): number {
  return dag.reduce((sum, node) => sum + node.estimatedCost, 0)
}
