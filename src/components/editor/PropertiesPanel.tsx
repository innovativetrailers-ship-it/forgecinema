'use client'

import { useState } from 'react'
import { RefreshCw, ChevronDown, ChevronRight, Sun, Sliders, Wand2 } from 'lucide-react'
import type { Clip, TimelineRecipe } from '@/lib/timeline/schema'
import { EFFECT_PRESETS } from './constants'

interface Props {
  selectedClip: Clip | null
  recipe: TimelineRecipe | null
  onOpenRepaint: (clip: Clip) => void
  onClipUpdate: (clipId: string, updates: Partial<Clip>) => void
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-white/6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[10px] font-semibold text-white/35 uppercase tracking-wider hover:text-white/55 transition-colors"
      >
        {title}
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

function Slider({ label, value, min, max, step = 0.01, onChange, unit = '' }: {
  label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string
}) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <span className="text-[10px] text-white/40 w-16 flex-shrink-0">{label}</span>
      <input
        type="range" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="flex-1 accent-[#00e5c8] h-1"
      />
      <span className="text-[10px] text-[#00e5c8]/80 w-10 text-right font-mono">
        {Number(value.toFixed(2))}{unit}
      </span>
    </div>
  )
}

export function PropertiesPanel({ selectedClip, recipe, onOpenRepaint, onClipUpdate }: Props) {
  const [activeEffectAdd, setActiveEffectAdd] = useState(false)

  if (!selectedClip) {
    // Project settings when nothing selected
    return (
      <div className="flex flex-col h-full">
        <div className="p-3 border-b border-white/8">
          <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Project</p>
        </div>
        <div className="p-3 space-y-3">
          <div>
            <p className="text-[10px] text-white/35 mb-1.5">FPS</p>
            <div className="flex gap-1.5">
              {[24, 30, 60].map((fps) => (
                <button key={fps} className={`px-2.5 py-1 rounded-lg border text-[10px] transition-colors
                  ${recipe?.fps === fps ? 'border-[#00e5c8] bg-[#00e5c8]/15 text-[#00e5c8]' : 'border-white/10 text-white/40 hover:border-white/20'}`}>
                  {fps}fps
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-white/35 mb-1.5">Colour Space</p>
            <select className="w-full bg-[#12121a] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white/60 focus:outline-none">
              <option>Rec.709</option>
              <option>DCI-P3</option>
              <option>Rec.2020</option>
            </select>
          </div>
          <div>
            <p className="text-[10px] text-white/35 mb-1">Duration</p>
            <p className="text-xs text-white/60">{recipe?.durationSeconds ?? 0}s</p>
          </div>
        </div>
      </div>
    )
  }

  const clip = selectedClip
  const clipDuration = clip.endTime - clip.startTime

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-white/8">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Clip Properties</p>
      </div>

      {/* Clip info */}
      <div className="px-3 py-2.5 border-b border-white/6">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-white/70 truncate flex-1 mr-2">
            {clip.modelUsed?.replace('_', ' ') ?? 'Clip'}
          </span>
          <span className="text-[10px] text-white/30 flex-shrink-0">{clipDuration.toFixed(1)}s</span>
        </div>
        {clip.prompt && (
          <p className="text-[10px] text-white/40 line-clamp-2 leading-relaxed mb-2">{clip.prompt}</p>
        )}
        {clip.characterId && (
          <div className="flex items-center gap-1.5 text-[10px] text-[#00e5c8]/70">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00e5c8]" />
            Character locked
          </div>
        )}
      </div>

      {/* Repaint button */}
      <div className="p-3 border-b border-white/6">
        <button
          onClick={() => onOpenRepaint(clip)}
          className="w-full py-2.5 rounded-xl bg-[#00e5c8] hover:bg-[#00f0d5] text-black font-semibold text-xs
            flex items-center justify-center gap-2 transition-colors shadow-lg shadow-[#00e5c8]/15"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Repaint Clip
        </button>
      </div>

      {/* Lighting */}
      <Section title="Lighting" defaultOpen={false}>
        <div className="space-y-2">
          <select className="w-full bg-[#12121a] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white/60 focus:outline-none mb-2">
            <option value="">Auto</option>
            <option value="studio">Studio</option>
            <option value="outdoor_day">Outdoor Day</option>
            <option value="outdoor_night">Night</option>
            <option value="sunset">Golden Hour</option>
            <option value="overcast">Overcast</option>
          </select>
          <button className="w-full py-1.5 rounded-lg border border-white/10 text-[10px] text-white/40
            hover:border-[#00e5c8]/30 hover:text-[#00e5c8] transition-colors flex items-center justify-center gap-1.5">
            <Sun className="w-3 h-3" />
            Apply IC-Light
          </button>
        </div>
      </Section>

      {/* Effects */}
      <Section title="Effects" defaultOpen={false}>
        <div className="space-y-1.5">
          {(clip.effects ?? []).map((effect, i) => (
            <div key={i} className="bg-white/4 rounded-lg p-2">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] text-white/60 font-medium">{effect.type.replace('_', ' ')}</span>
                <button
                  onClick={() => onClipUpdate(clip.id, {
                    effects: clip.effects?.filter((_, j) => j !== i)
                  })}
                  className="text-[9px] text-white/25 hover:text-red-400 transition-colors"
                >✕</button>
              </div>
              <Slider
                label="Intensity"
                value={effect.intensity}
                min={0} max={1}
                onChange={(v) => onClipUpdate(clip.id, {
                  effects: clip.effects?.map((e, j) => j === i ? { ...e, intensity: v } : e)
                })}
              />
            </div>
          ))}

          {activeEffectAdd ? (
            <div className="grid grid-cols-2 gap-1">
              {EFFECT_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onClipUpdate(clip.id, {
                      effects: [...(clip.effects ?? []), { type: preset.id as never, intensity: 0.5 }]
                    })
                    setActiveEffectAdd(false)
                  }}
                  className="py-1.5 rounded-lg bg-white/5 text-[10px] text-white/50 hover:bg-white/10 transition-colors text-center"
                >
                  {preset.icon} {preset.label}
                </button>
              ))}
            </div>
          ) : (
            <button
              onClick={() => setActiveEffectAdd(true)}
              className="w-full py-1.5 rounded-lg border border-dashed border-white/10 text-[10px]
                text-white/30 hover:border-white/25 hover:text-white/50 transition-colors"
            >
              + Add effect
            </button>
          )}
        </div>
      </Section>

      {/* Colour Grade */}
      <Section title="Colour Grade" defaultOpen={false}>
        <div className="space-y-1">
          <Slider label="Shadows" value={clip.colourGrade?.shadows ?? 0} min={-100} max={100}
            onChange={(v) => onClipUpdate(clip.id, { colourGrade: { ...(clip.colourGrade ?? {}), shadows: v } as never })} unit="%" />
          <Slider label="Midtones" value={clip.colourGrade?.midtones ?? 0} min={-100} max={100}
            onChange={(v) => onClipUpdate(clip.id, { colourGrade: { ...(clip.colourGrade ?? {}), midtones: v } as never })} unit="%" />
          <Slider label="Highlights" value={clip.colourGrade?.highlights ?? 0} min={-100} max={100}
            onChange={(v) => onClipUpdate(clip.id, { colourGrade: { ...(clip.colourGrade ?? {}), highlights: v } as never })} unit="%" />
          <Slider label="Temp" value={clip.colourGrade?.temperature ?? 6500} min={2700} max={10000}
            onChange={(v) => onClipUpdate(clip.id, { colourGrade: { ...(clip.colourGrade ?? {}), temperature: v } as never })} unit="K" />
          <Slider label="Tint" value={clip.colourGrade?.tint ?? 0} min={-100} max={100}
            onChange={(v) => onClipUpdate(clip.id, { colourGrade: { ...(clip.colourGrade ?? {}), tint: v } as never })} />
        </div>
      </Section>

      {/* Transform */}
      <Section title="Transform" defaultOpen={false}>
        <Slider label="Scale" value={clip.transform?.scale ?? 1} min={0.1} max={3}
          onChange={(v) => onClipUpdate(clip.id, { transform: { ...(clip.transform ?? { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }), scale: v } })} />
        <Slider label="Opacity" value={clip.transform?.opacity ?? 1} min={0} max={1}
          onChange={(v) => onClipUpdate(clip.id, { transform: { ...(clip.transform ?? { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }), opacity: v } })} />
        <Slider label="Rotation" value={clip.transform?.rotation ?? 0} min={-180} max={180}
          onChange={(v) => onClipUpdate(clip.id, { transform: { ...(clip.transform ?? { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 }), rotation: v } })} unit="°" />
      </Section>

      {/* Transition */}
      <Section title="Transition" defaultOpen={false}>
        <div className="space-y-2">
          <select
            value={clip.transition?.type ?? 'cut'}
            onChange={(e) => onClipUpdate(clip.id, {
              transition: { type: e.target.value as never, duration: clip.transition?.duration ?? 0.5 }
            })}
            className="w-full bg-[#12121a] border border-white/10 rounded-lg px-2.5 py-1.5 text-[10px] text-white/60 focus:outline-none"
          >
            <option value="cut">Cut</option>
            <option value="dissolve">Dissolve</option>
            <option value="fade">Fade</option>
            <option value="film_burn">Film Burn</option>
            <option value="wipe">Wipe</option>
            <option value="zoom">Zoom</option>
            <option value="glitch">Glitch</option>
          </select>
          {clip.transition && clip.transition.type !== 'cut' && (
            <Slider label="Duration" value={clip.transition.duration} min={0.1} max={2}
              onChange={(v) => onClipUpdate(clip.id, { transition: { ...clip.transition!, duration: v } })} unit="s" />
          )}
        </div>
      </Section>
    </div>
  )
}
