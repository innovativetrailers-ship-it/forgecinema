'use client'

import { useState, useEffect, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useEditorStore } from '@/store/editor'
import { useCredits } from '@/hooks/useCredits'
import { useVault } from '@/hooks/useVault'
import { nanoid } from 'nanoid'
import { toast } from 'sonner'

type Tier = 'draft' | 'standard' | 'cinematic' | 'film'

const TIER_CONFIG: Record<Tier, { label: string; cost: number; color: string }> = {
  draft:     { label: 'Quick Draft',   cost: 2,  color: 'text-gray-400' },
  standard:  { label: 'Standard',      cost: 8,  color: 'text-blue-400' },
  cinematic: { label: 'Cinematic',     cost: 25, color: 'text-[#00e5c8]' },
  film:      { label: 'Film Grade',    cost: 40, color: 'text-violet-400' },
}

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '21:9']

const DURATIONS = [3, 5, 8, 10, 15]

export function GeneratePanel() {
  const [prompt, setPrompt]                     = useState('')
  const [tier, setTier]                         = useState<Tier>('standard')
  const [duration, setDuration]                 = useState(5)
  const [aspectRatio, setAspectRatio]           = useState('16:9')
  const [selectedCharacterId, setSelectedChar]  = useState<string | null>(null)
  const [selectedLocationId, setSelectedLoc]    = useState<string | null>(null)
  const [isGenerating, setIsGenerating]         = useState(false)
  const [estimatedCost, setEstimatedCost]       = useState(8)
  const [progress, setProgress]                 = useState<number | null>(null)

  const queryClient    = useQueryClient()
  const { addClipToTrack, timeline }  = useEditorStore()
  const { balance }    = useCredits()
  const { characters } = useVault(null)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    const baseCost = TIER_CONFIG[tier].cost
    setEstimatedCost(Math.ceil(duration / 5) * baseCost)
  }, [tier, duration])

  useEffect(() => () => { eventSourceRef.current?.close() }, [])

  const insufficientCredits = balance < estimatedCost

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return }
    if (insufficientCredits) { toast.error(`Need ${estimatedCost} credits — you have ${balance}`); return }

    setIsGenerating(true)
    setProgress(0)

    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GENERATE',
          quality: tier,
          payload: {
            prompt,
            duration,
            aspectRatio,
            characterIds: selectedCharacterId ? [selectedCharacterId] : [],
            locationId: selectedLocationId ?? undefined,
          },
        }),
      })

      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Failed to create job')
      }

      const { jobId } = await res.json() as { jobId: string }

      // Add a placeholder clip to the first video track
      const placeholderClipId = nanoid()
      const firstTrack = timeline?.tracks.find((t) => t.type === 'video')
      if (firstTrack) {
        addClipToTrack(firstTrack.id, {
          id: placeholderClipId,
          trackId: firstTrack.id,
          startTime: 0,
          duration,
          src: '',
          type: 'video',
          name: 'Generating...',
          metadata: { jobId, generating: true },
        })
      }

      // Subscribe to SSE stream
      const sse = new EventSource(`/api/jobs/${jobId}/stream`)
      eventSourceRef.current = sse

      sse.onmessage = (e) => {
        try {
          const event = JSON.parse(e.data) as {
            status?: string
            progress?: number
            outputUrl?: string
            error?: string
          }

          if (typeof event.progress === 'number') setProgress(event.progress)

          if (event.status === 'COMPLETED' || event.status === 'COMPLETE') {
            sse.close()
            eventSourceRef.current = null
            setIsGenerating(false)
            setProgress(null)
            queryClient.invalidateQueries({ queryKey: ['credits', 'balance'] })
            toast.success('Generation complete')
          }

          if (event.status === 'FAILED') {
            sse.close()
            eventSourceRef.current = null
            setIsGenerating(false)
            setProgress(null)
            toast.error(event.error ?? 'Generation failed')
          }
        } catch {
          // ignore malformed events
        }
      }

      sse.onerror = () => {
        sse.close()
        eventSourceRef.current = null
        setIsGenerating(false)
        setProgress(null)
      }
    } catch (err) {
      setIsGenerating(false)
      setProgress(null)
      toast.error((err as Error).message ?? 'Failed to start generation')
    }
  }

  return (
    <div className="p-3 flex flex-col gap-3 h-full overflow-y-auto">
      <h3 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
        Generate Clip
      </h3>

      {/* Prompt */}
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe your scene in detail..."
        rows={5}
        className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded-lg p-2.5 text-xs text-white placeholder-gray-600 resize-none focus:border-[#00e5c8] focus:outline-none transition"
      />

      {/* Quality Tier */}
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">
          Quality
        </label>
        <div className="grid grid-cols-2 gap-1">
          {(Object.entries(TIER_CONFIG) as [Tier, typeof TIER_CONFIG[Tier]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setTier(key)}
              className={`px-2 py-1.5 rounded text-[11px] font-medium border transition ${
                tier === key
                  ? 'border-[#00e5c8] bg-[#00e5c8]/10 text-[#00e5c8]'
                  : 'border-[#2a3040] bg-[#1a1f2e] text-gray-400 hover:border-[#3a4050] hover:text-gray-200'
              }`}
            >
              {cfg.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">
          Duration
        </label>
        <div className="flex gap-1">
          {DURATIONS.map((d) => (
            <button
              key={d}
              onClick={() => setDuration(d)}
              className={`flex-1 py-1.5 rounded text-[11px] border transition ${
                duration === d
                  ? 'border-[#00e5c8] bg-[#00e5c8]/10 text-[#00e5c8]'
                  : 'border-[#2a3040] bg-[#1a1f2e] text-gray-400 hover:text-gray-200'
              }`}
            >
              {d}s
            </button>
          ))}
        </div>
      </div>

      {/* Aspect Ratio */}
      <div>
        <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">
          Aspect Ratio
        </label>
        <div className="flex gap-1 flex-wrap">
          {ASPECT_RATIOS.map((ar) => (
            <button
              key={ar}
              onClick={() => setAspectRatio(ar)}
              className={`px-2 py-1 rounded text-[10px] border transition ${
                aspectRatio === ar
                  ? 'border-[#00e5c8] bg-[#00e5c8]/10 text-[#00e5c8]'
                  : 'border-[#2a3040] bg-[#1a1f2e] text-gray-400 hover:text-gray-200'
              }`}
            >
              {ar}
            </button>
          ))}
        </div>
      </div>

      {/* Character selector */}
      {characters.length > 0 && (
        <div>
          <label className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5 block">
            Character
          </label>
          <select
            value={selectedCharacterId ?? ''}
            onChange={(e) => setSelectedChar(e.target.value || null)}
            className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded px-2 py-1.5 text-xs text-white focus:border-[#00e5c8] focus:outline-none"
          >
            <option value="">None</option>
            {characters.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {/* Progress bar */}
      {isGenerating && progress !== null && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-gray-500">
            <span>Processing...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-1 bg-[#1a1f2e] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00e5c8] rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Credits + Generate */}
      <div className="mt-auto pt-2 border-t border-[#1a1f2e]">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
            </svg>
            <span className={`text-xs font-mono ${insufficientCredits ? 'text-red-400' : 'text-white'}`}>
              {estimatedCost} credits
            </span>
          </div>
          {insufficientCredits && (
            <span className="text-[10px] text-red-400">You have {balance}</span>
          )}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim()}
          className="w-full py-2 bg-[#00e5c8] text-black text-xs font-bold rounded-lg hover:bg-[#00d4b8] disabled:opacity-40 disabled:cursor-not-allowed transition"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </div>
  )
}
