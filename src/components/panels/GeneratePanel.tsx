'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useEditorStore } from '@/store/editor'
import { useCredits } from '@/hooks/useCredits'
import { useVault } from '@/hooks/useVault'
import { nanoid } from 'nanoid'
import { usePlaybackStore } from '@/store/playbackStore'
import { useEditorRecipeView } from '@/lib/timeline/to-editor-recipe'
import { ensureEditorProject } from '@/lib/projects/loadProject'
import { toast } from 'sonner'
import { creditShortfall, dearestAffordable, quoteGenerationHold } from '@/lib/credits/quote'
import { CreditBalanceLine } from '@/components/ui/CreditBalanceLine'

interface CameraControl {
  panDirection:  number
  tiltDirection: number
  zoomLevel:     number
  roll:          number
  push:          number
  staticCamera:  boolean
}

const DEFAULT_CAMERA: CameraControl = {
  panDirection: 0, tiltDirection: 0, zoomLevel: 1, roll: 0, push: 0, staticCamera: false,
}

const CAMERA_PRESETS: Record<string, Partial<CameraControl>> = {
  'Slow push in':    { push: 0.3, zoomLevel: 1.2, panDirection: 0, tiltDirection: 0 },
  'Ken Burns right': { panDirection: 40, zoomLevel: 1.1, push: 0 },
  'Aerial reveal':   { tiltDirection: -60, zoomLevel: 0.8, push: -0.2 },
  'Static tripod':   { staticCamera: true },
  'Handheld walk':   { push: 0.5, panDirection: 15, tiltDirection: 5 },
  'Crane up':        { tiltDirection: -30, push: -0.3, zoomLevel: 0.9 },
}

type Tier = 'draft' | 'standard' | 'cinematic' | 'film'

const TIER_CONFIG: Record<Tier, { label: string; color: string }> = {
  draft:     { label: 'Quick Draft', color: 'text-gray-400' },
  standard:  { label: 'Standard',    color: 'text-blue-400' },
  cinematic: { label: 'Cinematic',   color: 'text-[#00e5c8]' },
  film:      { label: 'Film Grade',  color: 'text-violet-400' },
}

const ASPECT_RATIOS = ['16:9', '9:16', '1:1', '4:3', '21:9']

const DURATIONS = [3, 5, 8, 10, 15]

export function GeneratePanel() {
  const [prompt, setPrompt]                     = useState('')
  const [manualTier, setManualTier]             = useState<Tier | null>(null)
  const [duration, setDuration]                 = useState(5)
  const [aspectRatio, setAspectRatio]           = useState('16:9')
  const [selectedCharacterId, setSelectedChar]  = useState<string | null>(null)
  const [selectedLocationId]                    = useState<string | null>(null)
  const [isGenerating, setIsGenerating]         = useState(false)
  const [progress, setProgress]                 = useState<number | null>(null)
  const [camera, setCamera]                     = useState<CameraControl>(DEFAULT_CAMERA)

  const queryClient    = useQueryClient()
  const addClipToTrack = useEditorStore((s) => s.addClipToTrack)
  const timeline = useEditorRecipeView()
  const { balance, isLoading: creditsLoading, unlimited } = useCredits()
  const tierOptions = useMemo(() => (['draft', 'standard', 'cinematic', 'film'] as Tier[]).map((id) => ({
    id,
    label: TIER_CONFIG[id].label,
    credits: quoteGenerationHold({ tier: id, durationSeconds: duration }).credits,
  })), [duration])
  const tier: Tier = manualTier
    ?? (unlimited || creditsLoading || balance == null
      ? 'standard'
      : (dearestAffordable(tierOptions, balance)?.id ?? 'draft'))
  const quote = quoteGenerationHold({ tier, durationSeconds: duration })
  const gate = creditShortfall({
    balance: creditsLoading ? null : balance,
    credits: quote.credits,
    loading: creditsLoading,
    unlimited,
  })
  const editorProjectId = usePlaybackStore((s) => s.projectId)
  const { characters } = useVault(editorProjectId)
  const eventSourceRef = useRef<EventSource | null>(null)

  useEffect(() => () => { eventSourceRef.current?.close() }, [])

  async function handleGenerate() {
    if (!prompt.trim()) { toast.error('Enter a prompt first'); return }
    if (gate.short) { toast.error(`Need ${quote.credits} credits — you have ${balance}`); return }

    setIsGenerating(true)
    setProgress(0)

    try {
      const projectId = editorProjectId || (await ensureEditorProject()).projectId
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GENERATE',
          projectId,
          quality: tier,
          payload: {
            prompt,
            model: quote.model,
            duration,
            aspectRatio,
            characterIds: selectedCharacterId ? [selectedCharacterId] : [],
            locationId: selectedLocationId ?? undefined,
            cameraControl: camera,
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
          videoUrl: null,
          proxyUrl: null,
          thumbnailUrl: null,
          prompt,
          engineUsed: tier,
          tier,
          characterIds: selectedCharacterId ? [selectedCharacterId] : [],
          locationId: selectedLocationId,
          isGenerating: true,
          generationProgress: 0,
          jobId,
          trimIn: 0,
          trimOut: duration,
          volume: 1,
          opacity: 1,
          speed: 1,
          colourGradeJson: null,
          sfxMakeupJson: null,
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
        } catch (err) {
          console.warn("[caught] src/components/panels/GeneratePanel.tsx:178", err instanceof Error ? { name: err.name, message: err.message } : err)

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
      console.warn("[caught] src/components/panels/GeneratePanel.tsx:189", err instanceof Error ? { name: err.name, message: err.message } : err)

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
              onClick={() => setManualTier(key)}
              aria-pressed={tier === key}
              data-selected={tier === key ? 'true' : 'false'}
              data-quality-credits={quoteGenerationHold({ tier: key, durationSeconds: duration }).credits}
              className={`px-2 py-1.5 rounded text-[11px] font-medium border transition outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#00e5c8] ${
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

      {/* Camera direction */}
      <details className="border-t border-[#1a2030] pt-2">
        <summary className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider cursor-pointer hover:text-white transition">
          Camera direction
        </summary>
        <div className="space-y-2 mt-2">
          <select
            onChange={e => {
              const preset = CAMERA_PRESETS[e.target.value]
              if (preset) setCamera(prev => ({ ...prev, ...preset }))
            }}
            className="w-full px-2 py-1 bg-[#0d1117] border border-[#2a3040] rounded text-xs text-white"
          >
            <option value="">Custom</option>
            {Object.keys(CAMERA_PRESETS).map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          {([
            { label: 'Pan',  key: 'panDirection',  min: -100, max: 100,  step: 1   },
            { label: 'Tilt', key: 'tiltDirection', min: -100, max: 100,  step: 1   },
            { label: 'Zoom', key: 'zoomLevel',     min: 0.5,  max: 4.0,  step: 0.1 },
            { label: 'Roll', key: 'roll',          min: -30,  max: 30,   step: 1   },
            { label: 'Push', key: 'push',          min: -1,   max: 1,    step: 0.1 },
          ] as const).map(({ label, key, min, max, step }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[10px] text-[var(--text-tertiary)] w-8 shrink-0">{label}</span>
              <input
                type="range" min={min} max={max} step={step}
                value={camera[key] as number}
                onChange={e => setCamera(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                className="flex-1 accent-[#00e5c8] h-1"
              />
              <span className="text-[9px] text-[#00e5c8]/80 w-8 text-right font-mono">
                {(camera[key] as number).toFixed(1)}
              </span>
            </div>
          ))}
          <label className="flex items-center gap-2 text-[10px] text-gray-300">
            <input
              type="checkbox"
              checked={camera.staticCamera}
              onChange={e => setCamera(prev => ({ ...prev, staticCamera: e.target.checked }))}
            />
            Lock camera
          </label>
        </div>
      </details>

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
      <div className="sticky bottom-0 z-10 mt-auto border-t border-[#1a1f2e] bg-[var(--bg-elevated)] pt-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5" />
            </svg>
            <span className={`text-xs font-mono ${gate.short ? 'text-red-400' : 'text-white'}`}>
              {quote.credits} credits
            </span>
          </div>
          {gate.short && (
            <span className="text-[10px] text-red-400">You have {balance}</span>
          )}
          {quote.durationNote && <p className="text-[10px] text-gray-400 mb-1">{quote.durationNote}</p>}
          {quote.tierNote && <p className="text-[10px] text-gray-400 mb-1">{quote.tierNote}</p>}
        </div>

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !prompt.trim() || gate.generateDisabled}
          data-generate-credits={quote.credits}
          className="w-full py-2 bg-[#00e5c8] text-black text-xs font-bold rounded-lg hover:bg-[#00d4b8] disabled:opacity-40 disabled:cursor-not-allowed transition outline-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
        >
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
        <CreditBalanceLine
          balance={creditsLoading ? null : balance}
          cost={quote.credits}
          unlimited={unlimited}
          options={tierOptions}
        />
      </div>
    </div>
  )
}
