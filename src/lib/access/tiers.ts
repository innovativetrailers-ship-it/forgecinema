// Single source of truth for all subscription tier permissions and upgrade paths

export type SubscriptionTier = 'free' | 'pro' | 'studio' | 'ultimate' | 'admin'
export type QualityTier      = 'draft' | 'standard' | 'cinematic' | 'film'
export type UIMode           = 'simple' | 'advanced' | 'director' | 'film_series'

export interface TierPermissions {
  qualityTiers:       QualityTier[]
  uiModes:            UIMode[]
  maxDirectorModels:  number
  maxClipDuration:    number   // seconds
  maxProjectClips:    number
  exportFormats:      string[]
  canCollaborate:     boolean
  canPublishSocial:   boolean
  canUseVoiceClone:   boolean
  label:              string
  colour:             string
}

export const TIER_PERMISSIONS: Record<SubscriptionTier, TierPermissions> = {
  free: {
    qualityTiers:      ['draft'],
    uiModes:           ['simple'],
    maxDirectorModels: 0,
    maxClipDuration:   10,
    maxProjectClips:   5,
    exportFormats:     ['mp4_720p'],
    canCollaborate:    false,
    canPublishSocial:  false,
    canUseVoiceClone:  false,
    label:             'Free Trial',
    colour:            '#6b7280',
  },
  pro: {
    qualityTiers:      ['draft', 'standard', 'cinematic'],
    uiModes:           ['simple', 'advanced'],
    maxDirectorModels: 3,
    maxClipDuration:   30,
    maxProjectClips:   20,
    exportFormats:     ['mp4_720p', 'mp4_1080p'],
    canCollaborate:    false,
    canPublishSocial:  true,
    canUseVoiceClone:  false,
    label:             'Pro',
    colour:            '#3b82f6',
  },
  studio: {
    qualityTiers:      ['draft', 'standard', 'cinematic', 'film'],
    uiModes:           ['simple', 'advanced', 'director'],
    maxDirectorModels: 5,
    maxClipDuration:   120,
    maxProjectClips:   100,
    exportFormats:     ['mp4_720p', 'mp4_1080p', 'mp4_4k', 'mov_prores'],
    canCollaborate:    true,
    canPublishSocial:  true,
    canUseVoiceClone:  true,
    label:             'Studio',
    colour:            '#8b5cf6',
  },
  ultimate: {
    qualityTiers:      ['draft', 'standard', 'cinematic', 'film'],
    uiModes:           ['simple', 'advanced', 'director', 'film_series'],
    maxDirectorModels: 999,
    maxClipDuration:   600,
    maxProjectClips:   999,
    exportFormats:     ['mp4_720p', 'mp4_1080p', 'mp4_4k', 'mov_prores', 'dcp', 'imf'],
    canCollaborate:    true,
    canPublishSocial:  true,
    canUseVoiceClone:  true,
    label:             'Ultimate',
    colour:            '#00e5c8',
  },
  admin: {
    qualityTiers:      ['draft', 'standard', 'cinematic', 'film'],
    uiModes:           ['simple', 'advanced', 'director', 'film_series'],
    maxDirectorModels: 999,
    maxClipDuration:   999,
    maxProjectClips:   999,
    exportFormats:     ['mp4_720p', 'mp4_1080p', 'mp4_4k', 'mov_prores', 'dcp', 'imf'],
    canCollaborate:    true,
    canPublishSocial:  true,
    canUseVoiceClone:  true,
    label:             'Dev',
    colour:            '#00e5c8',
  },
}

// Upgrade path — which tier unlocks each feature
export const UPGRADE_REQUIRED: Record<string, SubscriptionTier> = {
  quality_standard:   'pro',
  quality_cinematic:  'pro',
  quality_film:       'studio',
  mode_advanced:      'pro',
  mode_director:      'studio',
  mode_film_series:   'ultimate',
  director_5_models:  'studio',
  director_unlimited: 'ultimate',
  export_4k:          'studio',
  export_prores:      'studio',
  export_dcp:         'ultimate',
  voice_clone:        'studio',
  collaborate:        'studio',
}

/** Map a user's subscriptionStatus + role to a SubscriptionTier. */
export function getUserTier(subscriptionStatus: string | null, role: string): SubscriptionTier {
  if (role === 'ADMIN') return 'admin'
  const map: Record<string, SubscriptionTier> = {
    pro:      'pro',
    studio:   'studio',
    ultimate: 'ultimate',
    active:   'pro',   // legacy 'active' → treat as pro
  }
  return map[subscriptionStatus ?? ''] ?? 'free'
}

export function canAccess(tier: SubscriptionTier, permission: keyof TierPermissions): boolean {
  return !!TIER_PERMISSIONS[tier]?.[permission]
}

const TIER_ORDER: SubscriptionTier[] = ['free', 'pro', 'studio', 'ultimate', 'admin']

/** Returns the required tier to upgrade to, or null if already unlocked. */
export function getRequiredUpgrade(
  currentTier: SubscriptionTier,
  featureKey:  string,
): SubscriptionTier | null {
  const required = UPGRADE_REQUIRED[featureKey] as SubscriptionTier | undefined
  if (!required) return null

  const current = TIER_ORDER.indexOf(currentTier)
  const need    = TIER_ORDER.indexOf(required)

  return current < need ? required : null
}
