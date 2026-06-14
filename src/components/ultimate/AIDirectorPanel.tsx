'use client'

import { useState } from 'react'
import { Sparkles, Brain, Zap, ChevronDown, Loader2, Film, Users, MapPin, Music } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { TimelineRecipe } from '@/lib/timeline/schema'
import { useUserTier } from '@/hooks/useUserTier'
import { MODEL_COUNCIL_DISPLAY } from '@/lib/routing/engineRegistry'
import { subscribeJobStream } from '@/lib/jobs/subscribeJobStream'
import { ShotPlanPanel } from '@/components/ultimate/ShotPlanPanel'
import { jobPlaybackPath } from '@/lib/media/jobPlayback'
import { useScriptStore } from '@/store/scriptStore'

interface Character { id: string; name: string; loraStatus: string }
interface Location { id: string; name: string }

const DIRECTOR_PRESETS = [
  { id: 'cinematic_drama', label: 'Cinematic Drama', description: 'Slow burn, rich colour, wide masters', icon: '🎬' },
  { id: 'action_thriller', label: 'Action Thriller', description: 'Fast cuts, handheld, high contrast', icon: '⚡' },
  { id: 'documentary', label: 'Documentary', description: 'Observational, naturalistic lighting', icon: '📽' },
  { id: 'music_video', label: 'Music Video', description: 'Beat-matched, stylised, energetic', icon: '🎵' },
  { id: 'commercial', label: 'Commercial', description: 'Clean, aspirational, product-forward', icon: '✨' },
  { id: 'horror', label: 'Horror', description: 'Unsettling angles, shadow play', icon: '🔦' },
]

interface Props {
  script: string
  projectId: string
  characters: Character[]
  locations: Location[]
  onRecipeGenerated: (recipe: TimelineRecipe) => void
  onShotCompleted: (
    shotId: string,
    videoUrl: string,
    duration: number,
    extras?: { posterUrl?: string; jobId?: string },
  ) => void
  onShotReset?: (shotIds: string[]) => void
  creditBalance: number
}

export function AIDirectorPanel({
  script, projectId, characters, locations, onRecipeGenerated, onShotCompleted, onShotReset, creditBalance,
}: Props) {
  const [selectedModels, setSelectedModels] = useState<string[]>(['veo-3.1', 'kling-3.0', 'seedance-2.0'])
  const [stylePreset, setStylePreset] = useState('cinematic_drama')
  const [customInstructions, setCustomInstructions] = useState('')
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '2.39:1'>('16:9')
  const [targetDuration, setTargetDuration] = useState(60)
  const [useCharacters, setUseCharacters] = useState(true)
  const [useLocations, setUseLocations] = useState(true)
  const [isDirecting, setIsDirecting] = useState(false)
  const [progressSteps, setProgressSteps] = useState<string[]>([])
  const [showCouncil, setShowCouncil] = useState(true)
  const [generationMode] = useState<'draft' | 'production'>('draft')

  const { isAdmin, perms } = useUserTier()
  const maxModels = isAdmin ? 999 : perms.maxDirectorModels

  const toggleModel = (id: string) => {
    setSelectedModels((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((m) => m !== id) : prev
      }
      if (prev.length >= maxModels) {
        window.dispatchEvent(new CustomEvent('show-upgrade-modal', {
          detail: {
            requiredTier: prev.length < 5 ? 'studio' : 'ultimate',
            feature:      'director_models',
            message:      `Your plan allows ${maxModels} model${maxModels === 1 ? '' : 's'} in Director mode.`,
          },
        }))
        return prev
      }
      return [...prev, id]
    })
  }

  const estimatedCredits = selectedModels.length * 40 + Math.ceil(targetDuration / 5) * 15

  const handleDirector = async () => {
    const liveScript = useScriptStore.getState().scriptContent.trim()
    if (isDirecting || !liveScript) return
    setIsDirecting(true)
    setProgressSteps([])

    const addStep = (msg: string) => setProgressSteps((s) => [...s, msg])

    try {
      addStep('Analysing script structure…')
      console.log('[Director] Script being sent (first 200 chars):', liveScript.slice(0, 200))
      const prompt = customInstructions.trim()
        ? `${liveScript}\n\nDirectorial notes (${stylePreset}): ${customInstructions}`
        : liveScript

      addStep('Queuing 6-phase orchestration…')

      console.log('[Director] Sending selectedModels:', selectedModels)

      const res = await fetch('/api/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode:           'director',
          source:         'director',
          generationMode: 'draft',
          prompt,
          selectedModels: selectedModels,
          duration:       targetDuration,
          projectId,
          aspectRatio,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string }
        throw new Error(err.error ?? 'Director request failed')
      }

      const { jobId } = await res.json() as { jobId: string }
      addStep('Rendering film — watch progress below…')

      subscribeJobStream(jobId, {
        onProgress: (data) => {
          if (data.message) addStep(data.message)
        },
          onComplete: (outputUrl) => {
            addStep('Done ✓')
            const trackId = 't-v1'
            const playPath = jobPlaybackPath(jobId) ?? outputUrl
            const recipe: TimelineRecipe = {
              id: nanoid(),
              projectId,
              fps: 24,
              resolution: { width: 1920, height: 1080 },
              durationSeconds: targetDuration,
              colorSpace: 'rec709',
              tracks: [{
                id: trackId,
                type: 'video',
                label: 'VIDEO 1',
                muted: false,
                locked: false,
                solo: false,
                clips: [{
                  id: nanoid(),
                  trackId,
                  startTime: 0,
                  endTime: targetDuration,
                  sourceUrl: playPath,
                  prompt: liveScript.slice(0, 500),
                  metadata: { jobId, outputUrl },
                }],
              }],
            }
            onRecipeGenerated(recipe)
            setIsDirecting(false)
          },
        onFailed: (error) => {
          addStep(`Error: ${error}`)
          setIsDirecting(false)
        },
        onClose: () => setIsDirecting(false),
      })
    } catch (err) {
      addStep(`Error: ${(err as Error).message}`)
      setIsDirecting(false)
    }
  }

  return (
    <div className="flex flex-col h-full w-full overflow-y-auto bg-[#0a0a12]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8 flex-shrink-0">
        <Brain className="w-4 h-4 text-purple-400" />
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">AI Director</span>
        <div className="flex-1" />
        <span className="text-[10px] text-[#00e5c8]/70 font-medium">⬡ ~{estimatedCredits}</span>
      </div>

      <div className="p-4 space-y-5">
        {/* Script status */}
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs
          ${script.trim() ? 'border-green-500/30 bg-green-500/8 text-green-400' : 'border-white/10 bg-white/3 text-white/30'}`}
        >
          <div className={`w-2 h-2 rounded-full ${script.trim() ? 'bg-green-500' : 'bg-white/20'}`} />
          {script.trim() ? `Script loaded · ${script.split('\n').length} lines` : 'No script — write one in Script tab'}
        </div>

        {/* Style preset */}
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2">Style Preset</p>
          <div className="grid grid-cols-2 gap-1.5">
            {DIRECTOR_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => setStylePreset(preset.id)}
                title={preset.description}
                className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-left transition-all
                  ${stylePreset === preset.id
                    ? 'border-purple-500/50 bg-purple-500/15 text-purple-300'
                    : 'border-white/8 bg-white/2 text-white/40 hover:border-white/20 hover:text-white/60'}`}
              >
                <span className="text-base leading-none flex-shrink-0">{preset.icon}</span>
                <span className="text-[10px] font-medium leading-tight">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Model Council */}
        <div>
          <button
            onClick={() => setShowCouncil((v) => !v)}
            className="w-full flex items-center justify-between mb-2"
          >
            <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold">Model Council</p>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                selectedModels.length >= maxModels && !isAdmin
                  ? 'bg-amber-500/20 text-amber-400'
                  : 'bg-white/5 text-gray-500'
              }`}>
                {isAdmin ? `${selectedModels.length} selected (unlimited)` : `${selectedModels.length} / ${maxModels} max`}
              </span>
              <ChevronDown className={`w-3 h-3 text-white/25 transition-transform ${showCouncil ? 'rotate-180' : ''}`} />
            </div>
          </button>
          {showCouncil && (
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-1">
              {MODEL_COUNCIL_DISPLAY.map((model) => {
                const active = selectedModels.includes(model.id)
                const atLimit = !isAdmin && !active && selectedModels.length >= maxModels
                return (
                  <button
                    key={model.id}
                    onClick={() => toggleModel(model.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl border transition-all text-left
                      ${active
                        ? 'border-white/20 bg-white/6'
                        : atLimit
                        ? 'border-white/6 bg-white/2 opacity-30'
                        : 'border-white/6 bg-white/2 opacity-50 hover:opacity-75'}`}
                  >
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: model.dotColor }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-medium text-white/75 truncate">{model.name}</span>
                        <span className="text-[9px] text-white/30 truncate">{model.role}</span>
                      </div>
                      <p className="text-[9px] text-white/30 truncate">{model.tagline}</p>
                    </div>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors
                      ${active ? 'border-[#00e5c8] bg-[#00e5c8]' : 'border-white/20 bg-transparent'}`}>
                      {active && <span className="text-[8px] text-black font-bold">✓</span>}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Parameters */}
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2">Parameters</p>
          <div className="space-y-2.5">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-white/40">Target Duration</span>
                <span className="text-[10px] text-[#00e5c8]">{targetDuration}s</span>
              </div>
              <input type="range" min={10} max={300} value={targetDuration}
                onChange={(e) => setTargetDuration(Number(e.target.value))}
                className="w-full accent-[#00e5c8] h-1" />
            </div>

            <div>
              <p className="text-[10px] text-white/40 mb-1">Aspect Ratio</p>
              <div className="flex gap-1.5">
                {(['16:9', '9:16', '2.39:1'] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setAspectRatio(r)}
                    className={`px-2.5 py-1 rounded-lg border text-[10px] transition-colors
                      ${aspectRatio === r ? 'border-[#00e5c8]/50 bg-[#00e5c8]/15 text-[#00e5c8]' : 'border-white/10 text-white/35 hover:border-white/20'}`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            {characters.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setUseCharacters((v) => !v)}
                  className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${useCharacters ? 'bg-[#00e5c8]' : 'bg-white/15'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useCharacters ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <Users className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/50">Use vault characters ({characters.length})</span>
              </label>
            )}
            {locations.length > 0 && (
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => setUseLocations((v) => !v)}
                  className={`w-8 h-4 rounded-full transition-colors relative flex-shrink-0 ${useLocations ? 'bg-[#00e5c8]' : 'bg-white/15'}`}>
                  <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${useLocations ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <MapPin className="w-3 h-3 text-white/30" />
                <span className="text-[10px] text-white/50">Use vault locations ({locations.length})</span>
              </label>
            )}
          </div>
        </div>

        {/* Custom instructions */}
        <div>
          <p className="text-[10px] text-white/35 uppercase tracking-wider font-semibold mb-2">Custom Instructions</p>
          <textarea
            value={customInstructions}
            onChange={(e) => setCustomInstructions(e.target.value)}
            placeholder="Additional directorial notes (e.g. 'keep colour palette desaturated', 'use handheld for all interior shots')…"
            className="w-full h-16 bg-[#12121a] border border-white/10 rounded-xl px-3 py-2
              text-[11px] text-white/70 placeholder:text-white/20 resize-none
              focus:outline-none focus:border-purple-500/40 transition-colors"
          />
        </div>

        {/* Progress log */}
        {progressSteps.length > 0 && (
          <div className="bg-black/30 rounded-xl p-3 space-y-1 border border-white/6">
            {progressSteps.map((step, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                  ${i === progressSteps.length - 1 && isDirecting ? 'bg-[#00f0d5] animate-pulse' : 'bg-green-500/60'}`} />
                <span className={i === progressSteps.length - 1 ? 'text-white/70' : 'text-white/30'}>{step}</span>
              </div>
            ))}
          </div>
        )}

        {/* Direct button */}
        <button
          onClick={handleDirector}
          disabled={isDirecting || !script.trim() || creditBalance < estimatedCredits}
          className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-teal-500
            text-white font-bold text-sm hover:from-purple-500 hover:to-teal-400
            disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-500/20
            flex items-center justify-center gap-2"
        >
          {isDirecting
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Directing…</>
            : <><Brain className="w-4 h-4" /> <Sparkles className="w-3.5 h-3.5" /> Direct This Film</>}
        </button>

        {creditBalance < estimatedCredits && (
          <p className="text-[10px] text-red-400/70 text-center">
            Need {estimatedCredits - creditBalance} more credits
          </p>
        )}

        <ShotPlanPanel
          projectId={projectId}
          script={script}
          selectedModels={selectedModels}
          mode={generationMode}
          targetDuration={targetDuration}
          onShotCompleted={onShotCompleted}
          onShotReset={onShotReset}
        />
      </div>
    </div>
  )
}
