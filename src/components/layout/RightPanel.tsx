'use client'

import { useState } from 'react'
import { useStudioStore } from '@/store/editor'
import { cn } from '@/lib/utils'

type RightTab = 'properties' | 'lighting' | 'colour' | 'effects' | 'audio' | 'transform'

const TABS: Array<{ id: RightTab; label: string }> = [
  { id: 'properties', label: 'Props' },
  { id: 'lighting',   label: 'Light' },
  { id: 'colour',     label: 'Colour' },
  { id: 'effects',    label: 'FX' },
  { id: 'audio',      label: 'Audio' },
  { id: 'transform',  label: 'Xform' },
]

export function RightPanel() {
  const [activeTab, setActiveTab] = useState<RightTab>('properties')
  const { selectedClipId } = useStudioStore()

  return (
    <aside className="w-[220px] shrink-0 flex flex-col bg-[var(--bg-elevated)] border-l border-[var(--border)]">
      {/* Tab bar */}
      <div className="flex border-b border-[var(--border)] shrink-0">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={cn(
              'flex-1 py-1.5 text-[9px] font-semibold uppercase tracking-wide transition-all',
              activeTab === t.id
                ? 'text-[var(--teal-bright)] border-b-2 border-[var(--teal-bright)] bg-[var(--teal-glow)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedClipId ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-[11px] text-[var(--text-tertiary)]">Select a clip to edit its properties</p>
          </div>
        ) : (
          <>
            {activeTab === 'properties' && <PropertiesTab />}
            {activeTab === 'lighting'   && <LightingTab />}
            {activeTab === 'colour'     && <ColourTab />}
            {activeTab === 'effects'    && <EffectsTab />}
            {activeTab === 'audio'      && <AudioTab />}
            {activeTab === 'transform'  && <TransformTab />}
          </>
        )}
      </div>
    </aside>
  )
}

// ── Properties tab ──────────────────────────────────────────────────
function PropertiesTab() {
  const { selectedClipId } = useStudioStore()
  return (
    <div className="space-y-0 divide-y divide-[var(--border)]">
      <Section label="Clip Info">
        <Row label="ID" value={selectedClipId?.slice(0, 8) ?? '—'} />
        <Row label="Duration" value="4.0 s" />
        <Row label="FPS" value="24" />
        <Row label="Resolution" value="1920 × 1080" />
      </Section>
      <Section label="Generation">
        <Row label="Model" value="Seedance 2.0" />
        <Row label="Tier" value="Studio" />
        <Row label="Seed" value="483920" />
        <Row label="Steps" value="40" />
      </Section>
      <Section label="Prompt">
        <p className="text-[10px] text-[var(--text-secondary)] leading-relaxed">
          Medium shot, detective walks through rain-soaked alley, noir lighting, cinematic grain
        </p>
      </Section>
    </div>
  )
}

// ── Lighting tab ──────────────────────────────────────────────────
function LightingTab() {
  return (
    <div className="divide-y divide-[var(--border)]">
      <Section label="IC-Light">
        <SliderRow label="Intensity" default={65} />
        <SliderRow label="Angle" default={45} max={360} />
        <SliderRow label="Spread" default={80} />
      </Section>
      <Section label="Tone">
        <SliderRow label="Exposure" default={50} />
        <SliderRow label="Contrast" default={50} />
        <SliderRow label="Shadows" default={50} />
        <SliderRow label="Highlights" default={50} />
      </Section>
      <Section label="Colour Temp">
        <SliderRow label="Temperature" default={50} />
        <SliderRow label="Tint" default={50} />
      </Section>
    </div>
  )
}

// ── Colour tab ──────────────────────────────────────────────────
function ColourTab() {
  return (
    <div className="divide-y divide-[var(--border)]">
      <Section label="Grading">
        <SliderRow label="Saturation" default={50} />
        <SliderRow label="Vibrance" default={50} />
        <SliderRow label="Hue Shift" default={50} max={360} />
      </Section>
      <Section label="Film Look">
        <div className="grid grid-cols-2 gap-1.5">
          {['Bleach Bypass', 'Cross-Process', 'Kodak 5219', 'Fuji Eterna', 'Teal & Orange', 'Vintage 70s'].map((lut) => (
            <button key={lut} className="pill text-[9px]">{lut}</button>
          ))}
        </div>
      </Section>
    </div>
  )
}

// ── Effects tab ──────────────────────────────────────────────────
function EffectsTab() {
  return (
    <div className="divide-y divide-[var(--border)]">
      <Section label="Post-FX">
        <Toggle label="Film Grain" />
        <Toggle label="Chromatic Aberration" />
        <Toggle label="Lens Vignette" />
        <Toggle label="Lens Flare" />
        <Toggle label="Depth of Field" />
      </Section>
      <Section label="Motion">
        <Toggle label="Motion Blur" />
        <Toggle label="Stabilise" />
        <SliderRow label="Blur Amount" default={30} />
      </Section>
    </div>
  )
}

// ── Audio tab ──────────────────────────────────────────────────
function AudioTab() {
  return (
    <div className="divide-y divide-[var(--border)]">
      <Section label="Volume">
        <SliderRow label="Volume" default={80} />
        <SliderRow label="Pan" default={50} />
        <Toggle label="Mute" />
      </Section>
      <Section label="EQ">
        <SliderRow label="Bass" default={50} />
        <SliderRow label="Mid" default={50} />
        <SliderRow label="Treble" default={50} />
      </Section>
    </div>
  )
}

// ── Transform tab ──────────────────────────────────────────────────
function TransformTab() {
  return (
    <div className="divide-y divide-[var(--border)]">
      <Section label="Position & Scale">
        <SliderRow label="X Position" default={50} />
        <SliderRow label="Y Position" default={50} />
        <SliderRow label="Scale" default={100} max={200} />
        <SliderRow label="Rotation" default={0} max={360} />
      </Section>
      <Section label="Crop">
        <SliderRow label="Top" default={0} />
        <SliderRow label="Bottom" default={0} />
        <SliderRow label="Left" default={0} />
        <SliderRow label="Right" default={0} />
      </Section>
    </div>
  )
}

// ── Shared sub-components ──────────────────────────────────────────
function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="px-3 py-2">
      <p className="panel-section-label">{label}</p>
      <div className="space-y-1">{children}</div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[10px] text-[var(--text-tertiary)]">{label}</span>
      <span className="text-[10px] text-[var(--text-secondary)] tabular-nums">{value}</span>
    </div>
  )
}

function SliderRow({ label, default: def = 50, max = 100 }: { label: string; default?: number; max?: number }) {
  const [v, setV] = useState(def)
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-[var(--text-tertiary)] w-20 shrink-0">{label}</span>
      <input type="range" min={0} max={max} value={v}
        onChange={(e) => setV(Number(e.target.value))}
        className="cinema-slider flex-1"
      />
      <span className="text-[9px] text-[var(--text-tertiary)] w-6 text-right tabular-nums">{v}</span>
    </div>
  )
}

function Toggle({ label }: { label: string }) {
  const [on, setOn] = useState(false)
  return (
    <div className="flex justify-between items-center py-0.5">
      <span className="text-[10px] text-[var(--text-secondary)]">{label}</span>
      <button
        onClick={() => setOn(!on)}
        className={cn(
          'w-7 h-3.5 rounded-full transition-colors relative',
          on ? 'bg-[var(--teal-bright)]' : 'bg-[var(--bg-active)]'
        )}
      >
        <span className={cn(
          'absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-all',
          on ? 'left-[14px]' : 'left-0.5'
        )} />
      </button>
    </div>
  )
}
