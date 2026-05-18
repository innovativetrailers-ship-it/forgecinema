'use client'

import { useState } from 'react'
import { Sparkles, ChevronDown } from 'lucide-react'
import { nanoid } from 'nanoid'
import { QUALITY_PILLS } from '@/components/simple/types'

interface Character { id: string; name: string; loraStatus?: string }
interface Location { id: string; name: string }

interface Props {
  projectId: string
  characters: Character[]
  locations: Location[]
  onJobCreated: (jobId: string, clipData: Record<string, unknown>) => void
  creditBalance: number
}

const MODELS = [
  { value: 'kling_standard', label: 'Kling Standard' },
  { value: 'kling_pro', label: 'Kling Pro' },
  { value: 'veo3', label: 'Veo 3' },
  { value: 'seedance', label: 'Seedance' },
  { value: 'runway', label: 'Runway Gen-4' },
  { value: 'luma', label: 'Luma Dream Machine' },
  { value: 'pika', label: 'Pika v2' },
  { value: 'minimax', label: 'Minimax' },
  { value: 'animatediff', label: 'AnimateDiff' },
  { value: 'hunyuan', label: 'HunyuanVideo' },
]

export function GeneratePanel({ projectId, characters, locations, onJobCreated, creditBalance }: Props) {
  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('kling_standard')
  const [quality, setQuality] = useState('standard')
  const [duration, setDuration] = useState(5)
  const [characterId, setCharacterId] = useState('')
  const [locationId, setLocationId] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const selectedPill = QUALITY_PILLS.find((p) => p.id === quality) ?? QUALITY_PILLS[1]

  const handleGenerate = async () => {
    if (!prompt.trim() || isLoading) return
    setIsLoading(true)
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GENERATE',
          payload: { prompt, model, duration, characterId: characterId || undefined, locationId: locationId || undefined },
        }),
      })
      const { jobId } = await res.json() as { jobId: string }
      onJobCreated(jobId, { prompt, model, duration, characterId, locationId, quality })
      setPrompt('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      <div className="p-3 border-b border-white/8">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Generate</p>
      </div>
      <div className="p-3 space-y-3 flex-1">
        {/* Prompt */}
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe shot..."
          className="w-full h-20 bg-[#12121a] border border-white/10 rounded-lg px-2.5 py-2
            text-white/80 placeholder:text-white/25 text-xs resize-none
            focus:outline-none focus:border-[#00e5c8]/40"
          onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) handleGenerate() }}
        />

        {/* Model */}
        <div>
          <p className="text-[10px] text-white/35 mb-1.5 uppercase tracking-wider">Model</p>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full bg-[#12121a] border border-white/10 rounded-lg px-2.5 py-1.5
              text-xs text-white/70 focus:outline-none focus:border-[#00e5c8]/40"
          >
            {MODELS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        {/* Quality */}
        <div>
          <p className="text-[10px] text-white/35 mb-1.5 uppercase tracking-wider">Quality</p>
          <div className="grid grid-cols-2 gap-1">
            {QUALITY_PILLS.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setQuality(pill.id)}
                className={`py-1.5 px-2 rounded-lg border text-[10px] text-left transition-all
                  ${quality === pill.id ? 'border-[#00e5c8] bg-[#00e5c8]/15 text-[#00e5c8]' : 'border-white/8 bg-white/3 text-white/40 hover:border-white/20'}`}
              >
                <div className="font-medium">{pill.label}</div>
                <div className="text-[#00e5c8]/60">⬡ {pill.credits}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] text-white/35 uppercase tracking-wider">Duration</p>
            <span className="text-[10px] text-[#00e5c8]">{duration}s</span>
          </div>
          <input
            type="range" min={3} max={60} value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-[#00e5c8]"
          />
        </div>

        {/* Character */}
        {characters.length > 0 && (
          <div>
            <p className="text-[10px] text-white/35 mb-1.5 uppercase tracking-wider">Character</p>
            <select
              value={characterId}
              onChange={(e) => setCharacterId(e.target.value)}
              className="w-full bg-[#12121a] border border-white/10 rounded-lg px-2.5 py-1.5
                text-xs text-white/70 focus:outline-none focus:border-[#00e5c8]/40"
            >
              <option value="">None</option>
              {characters.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.loraStatus === 'READY' ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Location */}
        {locations.length > 0 && (
          <div>
            <p className="text-[10px] text-white/35 mb-1.5 uppercase tracking-wider">Location</p>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full bg-[#12121a] border border-white/10 rounded-lg px-2.5 py-1.5
                text-xs text-white/70 focus:outline-none focus:border-[#00e5c8]/40"
            >
              <option value="">None</option>
              {locations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!prompt.trim() || isLoading || selectedPill.credits > creditBalance}
          className="w-full py-2.5 rounded-lg font-semibold text-xs bg-[#00e5c8] text-black
            hover:bg-[#00f0d5] disabled:opacity-40 disabled:cursor-not-allowed transition-colors
            flex items-center justify-center gap-1.5"
        >
          {isLoading ? (
            <><div className="w-3 h-3 border border-black/40 border-t-black rounded-full animate-spin" />Queuing…</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5" />Generate · ⬡ {selectedPill.credits}</>
          )}
        </button>
      </div>
    </div>
  )
}
