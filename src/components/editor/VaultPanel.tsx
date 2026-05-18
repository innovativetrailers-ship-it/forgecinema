'use client'

import { useState } from 'react'
import { Plus, Loader2, CheckCircle, Clock, AlertCircle, UserPlus } from 'lucide-react'
import { CharacterOnboarding } from '@/components/vault/CharacterOnboarding'
import type { CharacterOnboardingData } from '@/components/vault/CharacterOnboarding'
import { useVaultStore } from '@/store/vault'
import { toast } from '@/lib/toast'

interface Character {
  id: string
  name: string
  referenceUrls: string[]
  loraStatus: string
  modelFamily?: string | null
  renderCount: number
}

interface Props {
  projectId: string
  characters: Character[]
  onCharacterAdded: () => void
}

const LORA_STATUS_CONFIG = {
  PENDING: { label: 'Pending',    icon: <Clock className="w-3 h-3" />,                 color: 'text-[var(--text-tertiary)]' },
  TRAINING: { label: 'Training',  icon: <Loader2 className="w-3 h-3 animate-spin" />,  color: 'text-[var(--teal-bright)]' },
  READY: { label: 'LoRA Ready',   icon: <CheckCircle className="w-3 h-3" />,           color: 'text-[var(--success)]' },
  FAILED: { label: 'Failed',      icon: <AlertCircle className="w-3 h-3" />,           color: 'text-[var(--danger)]' },
}

export function VaultPanel({ projectId, characters, onCharacterAdded }: Props) {
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const { addCharacter } = useVaultStore()

  const handleOnboardingComplete = async (data: CharacterOnboardingData) => {
    addCharacter({
      name: data.name,
      role: 'supporting',
      description: '',
      faceReferenceUrls: data.referenceImages.map((f) => URL.createObjectURL(f)),
      modelFamily: data.modelFamily === 'any' ? 'auto' : data.modelFamily as never,
      triggerWord: data.triggerWord,
      loraJobId: data.loraJobId,
      makeupState: { type: 'clean', effects: [] },
    })
    const fd = new FormData()
    fd.append('name', data.name)
    fd.append('projectId', projectId)
    fd.append('triggerWord', data.triggerWord)
    fd.append('modelFamily', data.modelFamily)
    data.referenceImages.forEach((f) => fd.append('images', f))
    await fetch('/api/vault/character/create', { method: 'POST', body: fd }).catch(() => null)
    toast.success(`${data.name} added to vault`)
    onCharacterAdded()
  }

  return (
    <div className="flex flex-col h-full">
      <div className="panel-section flex items-center justify-between">
        <span className="panel-label">Characters</span>
        <button
          onClick={() => setOnboardingOpen(true)}
          className="w-5 h-5 rounded bg-[var(--teal-glow)] text-[var(--teal-bright)] hover:bg-[rgba(0,229,200,0.18)] flex items-center justify-center transition-colors"
          title="Add character"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      {/* Character list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {characters.length === 0 && (
          <div className="text-center py-10">
            <UserPlus className="w-8 h-8 text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-[11px] text-[var(--text-tertiary)]">No characters yet</p>
            <button
              onClick={() => setOnboardingOpen(true)}
              className="mt-2 text-[11px] text-[var(--teal-bright)] hover:text-[#00f0d5] transition-colors"
            >
              + Add character
            </button>
          </div>
        )}

        {characters.map((c) => {
          const statusCfg = LORA_STATUS_CONFIG[c.loraStatus as keyof typeof LORA_STATUS_CONFIG] ?? LORA_STATUS_CONFIG.PENDING
          return (
            <div
              key={c.id}
              className="cinema-card flex items-center gap-2 cursor-pointer hover:border-[var(--border-mid)] transition-all"
            >
              {c.referenceUrls[0] ? (
                <img src={c.referenceUrls[0]} alt={c.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-active)] flex items-center justify-center shrink-0">
                  <span className="text-[11px] text-[var(--text-tertiary)] font-bold">{c.name[0]}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">{c.name}</p>
                <div className={`flex items-center gap-1 text-[10px] ${statusCfg.color}`}>
                  {statusCfg.icon}
                  {statusCfg.label}
                </div>
              </div>
              {c.modelFamily && (
                <span className="text-[9px] text-[var(--text-tertiary)] shrink-0">{c.modelFamily}</span>
              )}
            </div>
          )
        })}
      </div>

      <CharacterOnboarding
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onComplete={handleOnboardingComplete}
        projectId={projectId}
      />
    </div>
  )
}
