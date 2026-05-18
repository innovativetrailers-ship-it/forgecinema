'use client'

import { useState } from 'react'
import { CharacterOnboarding } from '@/components/vault/CharacterOnboarding'
import type { CharacterOnboardingData } from '@/components/vault/CharacterOnboarding'
import { useVaultStore } from '@/store/vault'
import { toast } from '@/lib/toast'
import { Users, Plus, Loader2, CheckCircle, Clock, AlertCircle, Trash2 } from 'lucide-react'

const STATUS_COLOUR: Record<string, string> = {
  pending:  'text-[var(--text-tertiary)]',
  training: 'text-[var(--teal-bright)]',
  ready:    'text-[var(--success)]',
  failed:   'text-[var(--danger)]',
}

const STATUS_ICON: Record<string, React.ReactNode> = {
  pending:  <Clock size={10} />,
  training: <Loader2 size={10} className="animate-spin" />,
  ready:    <CheckCircle size={10} />,
  failed:   <AlertCircle size={10} />,
}

export function CharacterCastPanel() {
  const { characters, addCharacter, removeCharacter } = useVaultStore()
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOnboardingComplete = async (data: CharacterOnboardingData) => {
    setLoading(true)
    try {
      const char = addCharacter({
        name: data.name,
        role: 'supporting',
        description: '',
        faceReferenceUrls: data.referenceImages.map((f) => URL.createObjectURL(f)),
        modelFamily: data.modelFamily === 'any' ? 'auto' : data.modelFamily as never,
        triggerWord: data.triggerWord,
        loraJobId: data.loraJobId,
        makeupState: { type: 'clean', effects: [] },
      })

      // Also persist to API
      const fd = new FormData()
      fd.append('name', data.name)
      fd.append('projectId', 'global')
      fd.append('triggerWord', data.triggerWord)
      fd.append('modelFamily', data.modelFamily)
      data.referenceImages.forEach((f) => fd.append('images', f))
      await fetch('/api/vault/character/create', { method: 'POST', body: fd }).catch(() => null)
      toast.success(`${data.name} added to vault`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="panel-section flex items-center justify-between">
        <span className="panel-label flex items-center gap-1.5">
          <Users size={10} className="text-[var(--teal-bright)]" />
          Cast ({characters.length})
        </span>
        <button
          onClick={() => setOnboardingOpen(true)}
          className="w-5 h-5 rounded bg-[var(--teal-glow)] text-[var(--teal-bright)] hover:bg-[rgba(0,229,200,0.18)] flex items-center justify-center"
        >
          <Plus size={11} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {loading && (
          <div className="flex justify-center py-3">
            <Loader2 size={14} className="text-[var(--text-tertiary)] animate-spin" />
          </div>
        )}

        {!loading && characters.length === 0 && (
          <div className="text-center py-8">
            <Users size={28} className="text-[var(--text-tertiary)] mx-auto mb-3" />
            <p className="text-[11px] text-[var(--text-tertiary)]">No characters yet</p>
            <button
              onClick={() => setOnboardingOpen(true)}
              className="mt-2 text-[11px] text-[var(--teal-bright)] hover:text-[#00f0d5] transition-colors"
            >
              + Add character
            </button>
          </div>
        )}

        {characters.map((c) => (
          <div
            key={c.id}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('characterId', c.id)}
            className="cinema-card flex items-center gap-2 cursor-grab active:cursor-grabbing group"
          >
            {c.faceReferenceUrls[0] ? (
              <img src={c.faceReferenceUrls[0]} alt={c.name} className="w-8 h-8 rounded-lg object-cover shrink-0" />
            ) : (
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-active)] flex items-center justify-center shrink-0">
                <span className="text-[11px] font-bold text-[var(--text-tertiary)]">{c.name[0]}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-medium text-[var(--text-primary)] truncate">{c.name}</p>
              <div className={`flex items-center gap-1 text-[10px] ${STATUS_COLOUR[c.loraStatus] ?? STATUS_COLOUR.pending}`}>
                {STATUS_ICON[c.loraStatus] ?? STATUS_ICON.pending}
                {c.loraStatus === 'ready' ? 'LoRA ready' : c.loraStatus}
                {c.renderCount > 0 && <span className="text-[var(--text-tertiary)] ml-1">· {c.renderCount} renders</span>}
              </div>
            </div>
            <button
              onClick={() => { removeCharacter(c.id); toast.info(`${c.name} removed`) }}
              className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-all"
            >
              <Trash2 size={11} />
            </button>
          </div>
        ))}
      </div>

      <CharacterOnboarding
        open={onboardingOpen}
        onOpenChange={setOnboardingOpen}
        onComplete={handleOnboardingComplete}
        projectId="global"
      />
    </div>
  )
}
