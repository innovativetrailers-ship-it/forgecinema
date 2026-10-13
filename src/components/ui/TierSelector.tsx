'use client'

import { Lock } from 'lucide-react'
import { useUserTier } from '@/hooks/useUserTier'
import { type QualityTier, getRequiredUpgrade } from '@/lib/access/tiers'
import { quoteGenerationHold } from '@/lib/credits/quote'

const QUALITY_TIERS: Array<{
  id:      QualityTier
  label:   string
  feature: string
}> = [
  { id: 'draft',     label: 'Draft',     feature: '' },
  { id: 'standard',  label: 'Standard',  feature: 'quality_standard' },
  { id: 'cinematic', label: 'Cinematic', feature: 'quality_cinematic' },
  { id: 'film',      label: 'Film',      feature: 'quality_film' },
]

const UPGRADE_LABELS: Record<string, string> = {
  pro:      'Pro',
  studio:   'Studio',
  ultimate: 'Ultimate',
}

interface Props {
  value:    QualityTier
  onChange: (tier: QualityTier) => void
}

export function TierSelector({ value, onChange }: Props) {
  const { tier, isAdmin } = useUserTier()

  const isUnlocked = (featureKey: string) => {
    if (!featureKey) return true
    if (isAdmin) return true
    return !getRequiredUpgrade(tier, featureKey)
  }

  const handleSelect = (qualityTier: QualityTier, featureKey: string) => {
    if (!isUnlocked(featureKey)) {
      window.dispatchEvent(new CustomEvent('show-upgrade-modal', {
        detail: { requiredTier: getRequiredUpgrade(tier, featureKey), feature: qualityTier },
      }))
      return
    }
    onChange(qualityTier)
  }

  return (
    <div className="flex gap-1.5">
      {QUALITY_TIERS.map(qt => {
        const unlocked = isUnlocked(qt.feature)
        const active   = value === qt.id
        const required = qt.feature ? getRequiredUpgrade(tier, qt.feature) : null

        return (
          <button
            key={qt.id}
            onClick={() => handleSelect(qt.id, qt.feature)}
            title={!unlocked ? `Requires ${UPGRADE_LABELS[required ?? ''] ?? required} plan` : undefined}
            className={`relative flex flex-col items-center px-3 py-2 rounded-lg border transition text-center ${
              active && unlocked
                ? 'border-[#00e5c8] bg-[#00e5c8]/10 text-[#00e5c8]'
                : unlocked
                ? 'border-[#2a3040] text-gray-400 hover:border-[#3a4050] hover:text-gray-200'
                : 'border-[#1a2030] text-gray-600 cursor-pointer opacity-60 hover:opacity-80'
            }`}
          >
            {!unlocked && (
              <div className="absolute top-1 right-1">
                <Lock className="w-2.5 h-2.5 text-gray-600" />
              </div>
            )}

            <span className="text-[11px] font-semibold leading-none">{qt.label}</span>
            <span className="text-[9px] mt-0.5 opacity-70">{quoteGenerationHold({ tier: qt.id, durationSeconds: 5 }).model}</span>
            <span className="text-[9px] mt-0.5 opacity-50">{quoteGenerationHold({ tier: qt.id, durationSeconds: 5 }).ratePerFiveSeconds}cr/5s</span>

            {!unlocked && required && (
              <span className="mt-1 text-[8px] px-1 py-0.5 rounded bg-white/5 text-gray-500">
                {UPGRADE_LABELS[required]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
