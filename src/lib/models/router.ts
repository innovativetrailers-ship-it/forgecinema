import type { ModelRouterInput, VideoModel, QualityTier, SceneType } from './types'

export type { QualityTier, SceneType }

const TIER_MODEL_MAP: Record<QualityTier, VideoModel> = {
  draft: 'animatediff',
  standard: 'wan',
  premium: 'kling_standard',
  cinematic: 'kling_pro',
  film: 'veo3',
}

const SCENE_OVERRIDES: Partial<Record<SceneType, Partial<Record<QualityTier, VideoModel>>>> = {
  action: {
    premium: 'seedance',
    cinematic: 'runway',
    film: 'veo3',
  },
  aerial: {
    standard: 'luma',
    premium: 'luma',
    cinematic: 'runway',
    film: 'veo3',
  },
  dialogue: {
    premium: 'kling_pro',
    cinematic: 'kling_pro',
    film: 'veo3',
  },
  environment: {
    standard: 'minimax',
    premium: 'luma',
    cinematic: 'seedance',
    film: 'veo3',
  },
}

export function routeToModel(input: ModelRouterInput): VideoModel {
  const { quality, sceneType, hasCharacterRef, hasLoRA, userRole, budget } = input

  // Draft always uses cheapest model
  if (quality === 'draft') return 'animatediff'

  // LoRA models must stay within family — use kling_standard for LoRA injection
  if (hasLoRA) {
    if (quality === 'film' || quality === 'cinematic') return 'kling_pro'
    return 'kling_standard'
  }

  // Character refs prefer IP-Adapter compatible models
  if (hasCharacterRef && !hasLoRA) {
    if (quality === 'film') return 'veo3'
    if (quality === 'cinematic') return 'kling_pro'
    return 'kling_standard'
  }

  // FREE users capped at premium tier — check BEFORE scene overrides
  if (userRole === 'FREE' && quality === 'film') return 'kling_standard'

  // Budget override
  if (budget === 'low') {
    if (quality === 'film' || quality === 'cinematic') return 'kling_standard'
    return TIER_MODEL_MAP[quality]
  }

  // Scene-type-specific overrides
  if (sceneType && SCENE_OVERRIDES[sceneType]?.[quality]) {
    return SCENE_OVERRIDES[sceneType][quality]!
  }

  return TIER_MODEL_MAP[quality]
}

export function getDurationMultiplier(seconds: number): number {
  return Math.ceil(seconds / 5)
}

export function getOperationCostKey(model: VideoModel): string {
  const map: Record<VideoModel, string> = {
    wan: 'generate_wan',
    animatediff: 'generate_animatediff',
    luma: 'generate_luma',
    pika: 'generate_pika',
    minimax: 'generate_minimax',
    kling_standard: 'generate_kling_standard',
    kling_pro: 'generate_kling_pro',
    seedance: 'generate_seedance',
    runway: 'generate_runway',
    veo3: 'generate_veo3',
    svd: 'generate_wan',
    skyreels: 'generate_skyreels',
    ltx: 'generate_ltx',
    pixverse: 'generate_pixverse',
    cogvideox: 'generate_cog',
  }
  return map[model]
}
