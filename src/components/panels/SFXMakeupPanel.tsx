'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Sparkles, ChevronDown, ChevronRight } from 'lucide-react'
import { useStudioStore } from '@/store/editor'

type MakeupCategory = {
  label: string
  effects: string[]
}

const CATEGORIES: MakeupCategory[] = [
  {
    label: 'Age & Time',
    effects: ['Youth (–20 years)', 'Aged (+30 years)', 'Aged (+60 years)', 'Weathered skin', 'Period-era 1920s', 'Period-era 1950s'],
  },
  {
    label: 'Creature & Fantasy',
    effects: ['Alien skin', 'Vampire pale', 'Werewolf growl', 'Zombie decay', 'Orc texture', 'Deep-sea scales', 'Reptilian', 'Elemental glow'],
  },
  {
    label: 'Injury & Gore',
    effects: ['Bruised eyes', 'Laceration', 'Burns — 1st degree', 'Burns — 3rd degree', 'Infected wound', 'Bullet graze', 'Battle-worn'],
  },
  {
    label: 'Prosthetics & Augmentation',
    effects: ['Prosthetic nose', 'Prosthetic ear', 'Heavy brow', 'Bald cap', 'Strong jawline', 'Cybernetic implant', 'Scar tissue'],
  },
  {
    label: 'Beauty & Fashion',
    effects: ['High fashion glam', 'Gothic dark', 'Natural minimal', 'Avant-garde', 'Drag full face', '1980s neon', 'Editorial editorial'],
  },
  {
    label: 'Special FX',
    effects: ['Glowing eyes', 'Face paint tribal', 'Neon UV reactive', 'Melting wax', 'Marble veining', 'Invisible/cloaked'],
  },
]

export function SFXMakeupPanel() {
  const [expanded, setExpanded] = useState<string | null>('Creature & Fantasy')
  const [selected, setSelected] = useState<string | null>(null)
  const [intensity, setIntensity] = useState(75)
  const [blendMode, setBlendMode] = useState<'hard' | 'blend' | 'subtle'>('blend')
  const { selectedClipId } = useStudioStore()

  const handleApply = () => {
    if (!selected) return
    // TODO: wire to swarm makeup pipeline
    console.info('[SFXMakeup] Apply:', selected, 'intensity:', intensity, 'blend:', blendMode, 'clip:', selectedClipId)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="panel-section">
        <p className="panel-label mb-2 flex items-center gap-1.5">
          <Sparkles size={10} className="text-[var(--teal-bright)]" />
          SFX Makeup Engine
        </p>
        <p className="text-[10px] text-[var(--text-tertiary)]">Select an effect to apply to the selected clip or character.</p>
      </div>

      {/* Effect taxonomy */}
      <div className="flex-1 overflow-y-auto">
        {CATEGORIES.map((cat) => {
          const isOpen = expanded === cat.label
          return (
            <div key={cat.label} className="border-b border-[var(--border)]">
              <button
                className="collapsible-trigger px-3 py-2"
                onClick={() => setExpanded(isOpen ? null : cat.label)}
              >
                <span>{cat.label}</span>
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              </button>
              {isOpen && (
                <div className="px-3 pb-3 grid grid-cols-2 gap-1.5">
                  {cat.effects.map((fx) => (
                    <button
                      key={fx}
                      onClick={() => setSelected(fx)}
                      className={cn(
                        'text-[10px] px-2 py-1.5 rounded border text-left transition-all',
                        selected === fx
                          ? 'bg-[var(--teal-glow)] border-[var(--teal-border)] text-[var(--teal-bright)]'
                          : 'border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-mid)] hover:bg-[var(--bg-hover)]'
                      )}
                    >
                      {fx}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Controls */}
      {selected && (
        <div className="panel-section border-t border-[var(--border)]">
          <p className="panel-label mb-2">Selected: <span className="text-[var(--teal-bright)] normal-case">{selected}</span></p>

          <div className="mb-3">
            <div className="flex justify-between mb-1">
              <span className="text-[10px] text-[var(--text-secondary)]">Intensity</span>
              <span className="text-[10px] text-[var(--teal-bright)] tabular-nums">{intensity}%</span>
            </div>
            <input
              type="range" min={0} max={100} value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="cinema-slider"
            />
          </div>

          <div className="mb-3">
            <p className="text-[10px] text-[var(--text-secondary)] mb-1.5">Blend mode</p>
            <div className="flex gap-1.5">
              {(['subtle', 'blend', 'hard'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setBlendMode(m)}
                  className={cn(
                    'flex-1 py-1 rounded text-[10px] font-medium border capitalize transition-all',
                    blendMode === m
                      ? 'bg-[var(--teal-glow)] border-[var(--teal-border)] text-[var(--teal-bright)]'
                      : 'border-[var(--border)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                  )}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleApply}
            disabled={!selectedClipId}
            className="w-full py-2 rounded-md text-[11px] font-semibold bg-[var(--teal-bright)] text-[#03080e] hover:bg-[#00f0d5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Apply to clip
          </button>
          {!selectedClipId && (
            <p className="text-[9px] text-[var(--text-tertiary)] text-center mt-1">Select a clip first</p>
          )}
        </div>
      )}
    </div>
  )
}
