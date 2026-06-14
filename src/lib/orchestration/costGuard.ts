/**
 * Draft vs production generation — swap expensive models and cap resolution in draft.
 * Non-FAL providers (Runway, Grok, Replicate) are never downgraded to cheap FAL defaults.
 */

import { resolveModel } from '@/lib/models/resolve'

export type GenerationMode = 'draft' | 'production'

const DRAFT_MODEL_MAP: Record<string, string> = {
  'veo-3.1':            'ltx-2.3',
  'sora-2':             'ltx-2.3',
  'kling-3.0':          'wan-2.6',
  'kling-o3':           'wan-2.6',
  'seedance-2.0':       'ltx-2.3',
  'happyhorse-1.0':     'wan-2.6',
  'luma-ray3':          'ltx-2.3',
}

export function applyModeToModel(modelId: string, mode: GenerationMode): string {
  if (mode === 'production') return modelId
  try {
    const def = resolveModel(modelId)
    if (def.provider !== 'fal') return modelId
  } catch {
    return modelId
  }
  return DRAFT_MODEL_MAP[modelId] ?? modelId
}

export function applyModeToResolution(
  resolution: string,
  mode: GenerationMode,
): '480p' | '720p' | '1080p' {
  if (mode === 'draft') return '480p'
  if (resolution === '480p' || resolution === '720p' || resolution === '1080p') {
    return resolution
  }
  return '720p'
}
