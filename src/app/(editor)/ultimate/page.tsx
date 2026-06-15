'use client'

import { useState, useCallback, useRef, useEffect, lazy, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { nanoid } from 'nanoid'
import { FileText, Film, Brain, Layers, ShieldCheck, Sliders, Play, Pause, ChevronLeft, ChevronRight, MapPin } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { IconRail } from '@/components/layout/IconRail'
import { LeftPanel } from '@/components/layout/LeftPanel'
import { useUIStore, type PanelId } from '@/store/ui'
import { useProjectAutosave } from '@/hooks/useProjectAutosave'

// Lazy-load heavy Ultimate Mode panels to reduce initial bundle
const ScriptEditor = lazy(() =>
  import('@/components/ultimate/ScriptEditor').then((m) => ({ default: m.ScriptEditor }))
)
const StoryboardViewer = lazy(() =>
  import('@/components/ultimate/StoryboardViewer').then((m) => ({ default: m.StoryboardViewer }))
)
const AIDirectorPanel = lazy(() =>
  import('@/components/ultimate/AIDirectorPanel').then((m) => ({ default: m.AIDirectorPanel }))
)
const CGIInsertTool = lazy(() =>
  import('@/components/ultimate/CGIInsertTool').then((m) => ({ default: m.CGIInsertTool }))
)
const ContinuityChecker = lazy(() =>
  import('@/components/ultimate/ContinuityChecker').then((m) => ({ default: m.ContinuityChecker }))
)
const AudioMixingBoard = lazy(() =>
  import('@/components/ultimate/AudioMixingBoard').then((m) => ({ default: m.AudioMixingBoard }))
)
const LocationPanel = lazy(() =>
  import('@/components/panels/LocationPanel').then((m) => ({ default: m.LocationPanel }))
)

// Types still imported statically (no runtime cost)
import type { ScriptScene } from '@/components/ultimate/ScriptEditor'
import type { StoryboardShot } from '@/components/ultimate/StoryboardViewer'

// Reuse editor components for timeline + preview
import { InteractivePlayer } from '@/components/playback/InteractivePlayer'
import { Timeline } from '@/components/editor/Timeline'
import { PropertiesPanel } from '@/components/editor/PropertiesPanel'
import { RepaintModal } from '@/components/editor/RepaintModal'
import { ReviewPortalModal } from '@/components/review/ReviewPortalModal'
import { useCredits } from '@/hooks/useCredits'
import { DEFAULT_ZOOM } from '@/components/editor/constants'
import type { TimelineRecipe, Clip, Track } from '@/lib/timeline/schema'
import { fetchJsonSafe } from '@/lib/safeFetch'
import { fireRewardSignal } from '@/lib/feedback/signal'
import { useScriptStore } from '@/store/scriptStore'
import { usePlaybackStore } from '@/store/playbackStore'
import { importLegacyPendingClips } from '@/lib/timeline/importLegacyPending'
import { useJobStore } from '@/store/jobStore'
import { subscribeJobStream } from '@/lib/jobs/subscribeJobStream'
import { computeTimelineDuration, isVideoMediaUrl, sanitizeClipDuration } from '@/lib/timeline/playback'
import { reconcileRecipeFromShots } from '@/lib/timeline/reconcileTimeline'
import { jobPlaybackPath } from '@/lib/media/jobPlayback'
import type { ShotPlanCard } from '@/lib/studio/shotPlan'

type UltimateTab = 'script' | 'storyboard' | 'director' | 'cgi' | 'continuity' | 'audio' | 'locations'

// Panels that map to a UltimateTab in the bespoke film panel
const FILM_PANEL_IDS = new Set<PanelId>(['script', 'storyboard', 'ai_director', 'continuity', 'audio_mix', 'cgi', 'location'])

const PANEL_TO_FILM_TAB: Partial<Record<PanelId, UltimateTab>> = {
  script:      'script',
  storyboard:  'storyboard',
  ai_director: 'director',
  continuity:  'continuity',
  audio_mix:   'audio',
  cgi:         'cgi',
  location:    'locations',
}

const TABS: Array<{ id: UltimateTab; label: string; icon: React.ReactNode }> = [
  { id: 'script',      label: 'Script',      icon: <FileText className="w-3.5 h-3.5" /> },
  { id: 'storyboard',  label: 'Storyboard',  icon: <Film className="w-3.5 h-3.5" /> },
  { id: 'director',    label: 'AI Director', icon: <Brain className="w-3.5 h-3.5" /> },
  { id: 'cgi',         label: 'CGI',         icon: <Layers className="w-3.5 h-3.5" /> },
  { id: 'continuity',  label: 'Continuity',  icon: <ShieldCheck className="w-3.5 h-3.5" /> },
  { id: 'audio',       label: 'Audio Mix',   icon: <Sliders className="w-3.5 h-3.5" /> },
  { id: 'locations',   label: 'Locations',   icon: <MapPin className="w-3.5 h-3.5" /> },
]

const DEFAULT_TRACKS: Track[] = [
  { id: 't-v1', type: 'video', label: 'VIDEO 1', muted: false, locked: false, solo: false, clips: [] },
  { id: 't-v2', type: 'video', label: 'VIDEO 2', muted: false, locked: false, solo: false, clips: [] },
  { id: 't-vfx', type: 'vfx', label: 'VFX', muted: false, locked: false, solo: false, clips: [] },
  { id: 't-cgi', type: 'cgi', label: 'CGI', muted: false, locked: false, solo: false, clips: [] },
  { id: 't-music', type: 'audio', label: 'MUSIC', muted: false, locked: false, solo: false, volume: 0.7, clips: [] },
  { id: 't-voice', type: 'audio', label: 'VOICE', muted: false, locked: false, solo: false, volume: 1, clips: [] },
  { id: 't-sfx', type: 'audio', label: 'SFX', muted: false, locked: false, solo: false, volume: 0.6, clips: [] },
  { id: 't-cap', type: 'caption', label: 'CAPTIONS', muted: false, locked: false, solo: false, clips: [] },
]

function buildRecipe(projectId: string): TimelineRecipe {
  return {
    id: nanoid(),
    projectId,
    fps: 24,
    resolution: { width: 1920, height: 1080 },
    durationSeconds: 120,
    colorSpace: 'rec709',
    tracks: DEFAULT_TRACKS,
  }
}

interface Character { id: string; name: string; loraStatus: string; referenceUrls: string[]; modelFamily?: string | null; renderCount: number }
interface Location { id: string; name: string }
interface ActiveJob { jobId: string; clipId: string; trackId: string; progress: number; message: string }

export default function UltimatePage() {
  const { data: session } = useSession()
  const { balance: creditBalance } = useCredits()
  const storedProjectId = usePlaybackStore((s) => s.projectId)
  const projectId = useRef(storedProjectId ?? nanoid())

  // UIStore — icon rail / film toolbar panel selection
  const { activePanel } = useUIStore()

  const script = useScriptStore((s) => s.scriptContent)
  const scenes = useScriptStore((s) => s.parsedScenes)
  const shots = useScriptStore((s) => s.parsedShots)
  const setParsed = useScriptStore((s) => s.setParsed)
  const setShots = useScriptStore((s) => s.setShots)

  useEffect(() => {
    usePlaybackStore.getState().setProjectId(projectId.current)
    const { scriptProjectId, setScriptProjectId, clearScript } = useScriptStore.getState()
    if (scriptProjectId && scriptProjectId !== projectId.current) {
      clearScript()
    }
    setScriptProjectId(projectId.current)
    void importLegacyPendingClips().then((count) => {
      if (count > 0) {
        const fresh = usePlaybackStore.getState().recipe
        if (fresh) setRecipe(fresh)
      }
    })
  }, [])

  const [activeTab, setActiveTab] = useState<UltimateTab>('script')
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [rightCollapsed, setRightCollapsed] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 320
    const stored = localStorage.getItem('cinema-left-panel-width')
    if (!stored) return 320
    const parsed = parseInt(stored, 10)
    return isNaN(parsed) ? 320 : Math.max(280, Math.min(600, parsed))
  })
  const panelRef = useRef<HTMLDivElement>(null)

  const startLeftResize = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const panelEl = panelRef.current
    if (!panelEl) return
    const panelLeft = panelEl.getBoundingClientRect().left

    const onMouseMove = (ev: MouseEvent) => {
      const newWidth = Math.max(280, Math.min(600, ev.clientX - panelLeft))
      setLeftPanelWidth(newWidth)
      localStorage.setItem('cinema-left-panel-width', String(newWidth))
    }
    const onMouseUp = () => {
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }

    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])

  // Timeline state
  const storedRecipe = usePlaybackStore((s) => s.recipe)
  const storedPlayhead = usePlaybackStore((s) => s.playheadTime)
  const persistRecipe = usePlaybackStore((s) => s.setRecipe)
  const persistPlayhead = usePlaybackStore((s) => s.setPlayhead)

  const [recipe, setRecipe] = useState<TimelineRecipe>(() => storedRecipe ?? buildRecipe(projectId.current))
  useProjectAutosave(recipe)

  useEffect(() => {
    void fetch(`/api/projects/${projectId.current}/save`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recipe: storedRecipe ?? buildRecipe(projectId.current) }),
    }).catch(() => {})
  }, [])

  const [playheadTime, setPlayheadTime] = useState(storedPlayhead)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM)
  const [scrollOffset, setScrollOffset] = useState(0)
  const [repaintClip, setRepaintClip] = useState<Clip | null>(null)
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // Undo/redo
  const historyRef = useRef<TimelineRecipe[]>([])
  const historyIndexRef = useRef(-1)

  const commitHistory = useCallback((r: TimelineRecipe) => {
    const stack = historyRef.current.slice(0, historyIndexRef.current + 1)
    stack.push(r)
    historyRef.current = stack.slice(-50)
    historyIndexRef.current = historyRef.current.length - 1
    setRecipe(r)
    persistRecipe(r)
  }, [persistRecipe])

  useEffect(() => {
    persistPlayhead(playheadTime)
  }, [playheadTime, persistPlayhead])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current--
    setRecipe(historyRef.current[historyIndexRef.current])
  }, [])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current++
    setRecipe(historyRef.current[historyIndexRef.current])
  }, [])

  // Load vault data
  useEffect(() => {
    if (!session) return
    Promise.all([
      fetchJsonSafe<{ characters?: Character[] }>('/api/vault/character/list', {}),
      fetchJsonSafe<{ locations?: Location[] }>('/api/vault/location/list', {}),
    ]).then(([chars, locs]) => {
      setCharacters(chars.characters ?? [])
      setLocations(locs.locations ?? [])
    }).catch(console.error)
  }, [session])

  const allClips = recipe.tracks.flatMap((t) => t.clips)
  const timelineDuration = computeTimelineDuration(recipe.tracks, recipe.durationSeconds)

  // Keyboard shortcuts — playback clock driven by video onTimeUpdate (VideoPreview)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying((p) => !p) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      if (e.key === 'Home') setPlayheadTime(0)
      if (e.key === 'End') setPlayheadTime(timelineDuration)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, timelineDuration])

  // Sync icon rail / film toolbar → local activeTab
  useEffect(() => {
    if (!activePanel) return
    const mapped = PANEL_TO_FILM_TAB[activePanel]
    if (mapped) {
      setActiveTab(mapped)
      setLeftCollapsed(false)
    } else {
      // Non-film panel (Cast, Makeup, Vault, etc.) — expand panel area so <LeftPanel /> is visible
      setLeftCollapsed(false)
    }
  }, [activePanel])

  const selectedClip = selectedClipId ? allClips.find((c) => c.id === selectedClipId) ?? null : null

  const handlePlaybackEnded = useCallback(() => {
    const videoClips = allClips
      .filter((c) => c.sourceUrl && isVideoMediaUrl(c.sourceUrl))
      .sort((a, b) => a.startTime - b.startTime)
    const current = videoClips.find(
      (c) => c.startTime <= playheadTime && c.endTime > playheadTime,
    )
    if (!current) {
      setIsPlaying(false)
      return
    }
    const idx = videoClips.indexOf(current)
    const next = videoClips[idx + 1]
    if (next) {
      setPlayheadTime(next.startTime)
    } else {
      setIsPlaying(false)
      setPlayheadTime(timelineDuration)
    }
  }, [allClips, playheadTime, timelineDuration])

  // Storyboard handlers
  const handleScenesExtracted = useCallback((extracted: ScriptScene[]) => {
    // Build storyboard shots from scenes
    const newShots: StoryboardShot[] = extracted.flatMap((scene, si) =>
      Array.from({ length: Math.max(1, Math.ceil(scene.estimatedDuration / 8)) }, (_, i) => ({
        id: nanoid(),
        sceneId: scene.id,
        shotNumber: si * 10 + (i + 1) * 10,
        shotType: ['WS', 'MS', 'CU', 'OS'][i % 4] as StoryboardShot['shotType'],
        cameraAngle: 'Eye Level',
        action: i === 0 ? scene.action : scene.dialogue[i - 1] ?? scene.action,
        dialogue: scene.dialogue[i],
        characters: scene.characters,
        estimatedDuration: Math.ceil(scene.estimatedDuration / Math.max(1, Math.ceil(scene.estimatedDuration / 8))),
        status: 'pending',
      }))
    )
    setParsed(extracted, newShots)
    setActiveTab('storyboard')
  }, [setParsed])

  const handleShotUpdate = useCallback((shotId: string, updates: Partial<StoryboardShot>) => {
    const next = useScriptStore.getState().parsedShots.map((s) =>
      s.id === shotId ? { ...s, ...updates } : s
    )
    setShots(next)
  }, [setShots])

  const handleRegenerateFrame = useCallback(async (shotId: string) => {
    const shot = shots.find((s) => s.id === shotId)
    if (!shot) return
    handleShotUpdate(shotId, { status: 'generating_frame' })
    try {
      const screenplay = `INT. SCENE - DAY\n${shot.shotType} ${shot.cameraAngle}. ${shot.action}`
      const res = await fetch('/api/storyboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ screenplay, style: 'cinematic' }),
      })
      if (!res.ok) throw new Error('Storyboard frame failed')
      const data = await res.json() as { scenes?: Array<{ imageUrl?: string }> }
      const imageUrl = data.scenes?.[0]?.imageUrl
      if (imageUrl) {
        handleShotUpdate(shotId, { frameImageUrl: imageUrl, status: 'frame_ready' })
      } else {
        handleShotUpdate(shotId, { status: 'failed' })
      }
    } catch { handleShotUpdate(shotId, { status: 'failed' }) }
  }, [shots, handleShotUpdate])

  const handleGenerateVideo = useCallback(async (shotId: string) => {
    const shot = shots.find((s) => s.id === shotId)
    if (!shot?.frameImageUrl) return
    handleShotUpdate(shotId, { status: 'generating_video' })
    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'GENERATE',
          projectId: projectId.current,
          payload: {
            prompt: `${shot.shotType} ${shot.cameraAngle} ${shot.action}`,
            startFrameUrl: shot.frameImageUrl,
            duration: shot.estimatedDuration,
            model: 'kling_standard',
            quality: 'premium',
          },
        }),
      })
      const { jobId } = await res.json() as { jobId: string }
      const sse = new EventSource(`/api/jobs/${jobId}/stream`)
      sse.onmessage = (e) => {
        const data = JSON.parse(e.data) as { status: string; outputUrl?: string }
        if (data.status === 'complete' && data.outputUrl) {
          handleShotUpdate(shotId, { generatedVideoUrl: data.outputUrl, status: 'complete' })
          sse.close()
        } else if (data.status === 'failed') {
          handleShotUpdate(shotId, { status: 'failed' })
          sse.close()
        }
      }
      sse.onerror = () => { handleShotUpdate(shotId, { status: 'failed' }); sse.close() }
    } catch { handleShotUpdate(shotId, { status: 'failed' }) }
  }, [shots, handleShotUpdate])

  const handleAddShotToTimeline = useCallback((shot: StoryboardShot) => {
    if (!shot.generatedVideoUrl) return
    const trackId = 't-v1'
    const mainTrack = recipe.tracks.find((t) => t.id === trackId)
    const lastEnd = mainTrack?.clips.reduce((max, c) => Math.max(max, c.endTime), 0) ?? 0
    const clipId = nanoid()
    const newClip: Clip = {
      id: clipId,
      trackId,
      startTime: lastEnd,
      endTime: lastEnd + shot.estimatedDuration,
      sourceUrl: shot.generatedVideoUrl,
      prompt: shot.action,
    }
    commitHistory({
      ...recipe,
      tracks: recipe.tracks.map((t) => t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t),
    })
  }, [recipe, commitHistory])

  // AI Director recipe applied
  const handleRecipeGenerated = useCallback((newRecipe: TimelineRecipe) => {
    commitHistory(newRecipe)
    setActiveTab('storyboard')
  }, [commitHistory])

  const handleShotPlanReset = useCallback((shotIds: string[]) => {
    const remove = new Set(shotIds)
    commitHistory({
      ...recipe,
      tracks: recipe.tracks.map((t) => ({
        ...t,
        clips: t.clips.filter((c) => {
          const meta = c.metadata as { shotPlanId?: string } | undefined
          return !meta?.shotPlanId || !remove.has(meta.shotPlanId)
        }),
      })),
    })
  }, [recipe, commitHistory])

  const handleShotPlanCompleted = useCallback((
    shotId: string,
    videoUrl: string,
    duration: number,
    extras?: { posterUrl?: string; jobId?: string },
  ) => {
    const trackId = 't-v1'
    const mainTrack = recipe.tracks.find((t) => t.id === trackId)
    const lastEnd = mainTrack?.clips.reduce((max, c) => Math.max(max, c.endTime), 0) ?? 0
    const dur = sanitizeClipDuration(duration, 5)
    const sourceUrl = extras?.jobId ? (jobPlaybackPath(extras.jobId) ?? videoUrl) : videoUrl
    const clipId = nanoid()
    const newClip: Clip = {
      id: clipId,
      trackId,
      startTime: lastEnd,
      endTime: lastEnd + dur,
      sourceUrl,
      posterUrl: extras?.posterUrl,
      prompt: `Shot ${shotId.slice(0, 8)}`,
      metadata: { shotPlanId: shotId, jobId: extras?.jobId },
    }
    const nextTracks = recipe.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: [...t.clips, newClip] } : t,
    )
    commitHistory({
      ...recipe,
      durationSeconds: computeTimelineDuration(nextTracks, recipe.durationSeconds),
      tracks: nextTracks,
    })
    setActiveTab('storyboard')
  }, [recipe, commitHistory])

  const handleShotsReloaded = useCallback((shots: ShotPlanCard[]) => {
    const next = reconcileRecipeFromShots(shots, recipe)
    if (next === recipe) return
    commitHistory(next)
  }, [recipe, commitHistory])

  // Timeline mutations
  const handleClipMove = useCallback((clipId: string, newStart: number, targetTrackId: string) => {
    const updated = { ...recipe }
    updated.tracks = recipe.tracks.map((track) => {
      const clip = track.clips.find((c) => c.id === clipId)
      if (!clip) return track
      if (track.id === targetTrackId) {
        const dur = clip.endTime - clip.startTime
        return { ...track, clips: track.clips.map((c) => c.id === clipId ? { ...c, startTime: newStart, endTime: newStart + dur } : c) }
      }
      return { ...track, clips: track.clips.filter((c) => c.id !== clipId) }
    })
    setRecipe(updated)
  }, [recipe])

  const handleClipTrim = useCallback((clipId: string, edge: 'start' | 'end', newTime: number) => {
    commitHistory({
      ...recipe,
      tracks: recipe.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((c) => {
          if (c.id !== clipId) return c
          if (edge === 'start') return { ...c, startTime: Math.min(newTime, c.endTime - 0.5) }
          return { ...c, endTime: Math.max(newTime, c.startTime + 0.5) }
        }),
      })),
    })
  }, [recipe, commitHistory])

  const handleClipUpdate = useCallback((clipId: string, updates: Partial<Clip>) => {
    commitHistory({
      ...recipe,
      tracks: recipe.tracks.map((track) => ({
        ...track,
        clips: track.clips.map((c) => c.id === clipId ? { ...c, ...updates } : c),
      })),
    })
  }, [recipe, commitHistory])

  const handleTrackToggleMute = useCallback((trackId: string) => {
    commitHistory({ ...recipe, tracks: recipe.tracks.map((t) => t.id === trackId ? { ...t, muted: !t.muted } : t) })
  }, [recipe, commitHistory])

  // Audio tracks applied from mixing board
  const handleAudioTracksApplied = useCallback((tracks: Array<{ channelId: string; url: string; duration: number }>) => {
    const audioTrackId = 't-music'
    const track = recipe.tracks.find((t) => t.id === audioTrackId)
    const lastEnd = track?.clips.reduce((max, c) => Math.max(max, c.endTime), 0) ?? 0
    const newClips: Clip[] = tracks.map((t) => ({
      id: nanoid(),
      trackId: audioTrackId,
      startTime: lastEnd,
      endTime: lastEnd + t.duration,
      sourceUrl: t.url,
    }))
    commitHistory({
      ...recipe,
      tracks: recipe.tracks.map((t) =>
        t.id === audioTrackId ? { ...t, clips: [...t.clips, ...newClips] } : t
      ),
    })
  }, [recipe, commitHistory])

  // Export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/timeline/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId: projectId.current, recipe }),
      })
      const { jobId } = await res.json() as { jobId: string }
      // Exporting the film is the strongest positive signal in the RLAIF loop.
      fireRewardSignal(jobId, 'export')
      const sse = new EventSource(`/api/jobs/${jobId}/stream`)
      sse.onmessage = (e) => {
        const data = JSON.parse(e.data) as { status: string; outputUrl?: string }
        if (data.status === 'complete' && data.outputUrl) {
          window.open(data.outputUrl, '_blank')
          setIsExporting(false)
          sse.close()
        } else if (data.status === 'failed') { setIsExporting(false); sse.close() }
      }
      sse.onerror = () => { setIsExporting(false) }
    } catch { setIsExporting(false) }
  }

  const selectedClipForCGI = selectedClip

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden">
      <TopBar />

      {/* Body: IconRail | left panel | centre | right panel */}
      <div className="flex flex-1 w-full overflow-hidden">
        <IconRail />

        {/* Film-grade left panel — or icon-rail panel when a non-film panel is active */}
        {activePanel && !FILM_PANEL_IDS.has(activePanel) ? (
          <LeftPanel />
        ) : null}

        <div
          className={`flex flex-col border-r border-[var(--border)] transition-all duration-200 flex-shrink-0 bg-[var(--bg-elevated)]
            ${leftCollapsed ? 'w-10' : activePanel && !FILM_PANEL_IDS.has(activePanel) ? 'w-0 overflow-hidden' : 'w-[360px]'}`}
        >
          {/* Tab pills */}
          <div className={`flex flex-col border-b border-[var(--border)] ${leftCollapsed ? 'items-center py-2 gap-1' : 'flex-row flex-wrap gap-0'}`}>
            {leftCollapsed ? (
              <>
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setLeftCollapsed(false) }}
                    title={tab.label}
                    className={`p-2 rounded-lg transition-colors ${activeTab === tab.id ? 'text-[var(--teal-bright)] bg-[var(--teal-glow)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                  >
                    {tab.icon}
                  </button>
                ))}
                <button onClick={() => setLeftCollapsed(false)} className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] mt-2">
                  <ChevronRight className="w-3 h-3" />
                </button>
              </>
            ) : (
              <>
                {TABS.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border)] text-[10px] font-medium transition-colors
                      ${activeTab === tab.id ? 'text-[var(--teal-bright)] bg-[var(--teal-glow)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'}`}
                  >
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </button>
                ))}
                <button onClick={() => setLeftCollapsed(true)} className="ml-auto p-2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
                  <ChevronLeft className="w-3 h-3" />
                </button>
              </>
            )}
          </div>

          {/* Panel content */}
          {!leftCollapsed && (
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<div className="flex items-center justify-center h-full text-zinc-500 text-sm">Loading…</div>}>
              <div className={activeTab === 'script' ? 'h-full' : 'hidden'}>
                <ScriptEditor onScenesExtracted={handleScenesExtracted} />
              </div>
              {activeTab === 'storyboard' && (
                <StoryboardViewer
                  scenes={scenes}
                  shots={shots}
                  onShotUpdate={handleShotUpdate}
                  onRegenerateFrame={handleRegenerateFrame}
                  onGenerateVideo={handleGenerateVideo}
                  onAddToTimeline={handleAddShotToTimeline}
                />
              )}
              {activeTab === 'director' && (
                <AIDirectorPanel
                  script={script}
                  projectId={projectId.current}
                  characters={characters}
                  locations={locations}
                  onRecipeGenerated={handleRecipeGenerated}
                  onShotCompleted={handleShotPlanCompleted}
                  onShotReset={handleShotPlanReset}
                  onShotsReloaded={handleShotsReloaded}
                  creditBalance={creditBalance}
                />
              )}
              {activeTab === 'cgi' && (
                <CGIInsertTool
                  sourceVideoUrl={selectedClipForCGI?.sourceUrl}
                  videoDuration={selectedClipForCGI ? selectedClipForCGI.endTime - selectedClipForCGI.startTime : recipe.durationSeconds}
                  onInsertComplete={(insert) => {
                    if (!insert.outputUrl) return
                    const clipId = nanoid()
                    commitHistory({
                      ...recipe,
                      tracks: recipe.tracks.map((t) =>
                        t.id === 't-cgi'
                          ? { ...t, clips: [...t.clips, { id: clipId, trackId: 't-cgi', startTime: insert.insertAt, endTime: insert.insertAt + insert.duration, sourceUrl: insert.outputUrl! }] }
                          : t
                      ),
                    })
                  }}
                />
              )}
              {activeTab === 'continuity' && (
                <ContinuityChecker
                  recipe={recipe}
                  clips={allClips}
                  onRepaintSuggested={(clipId) => {
                    const clip = allClips.find((c) => c.id === clipId)
                    if (clip) setRepaintClip(clip)
                  }}
                />
              )}
              {activeTab === 'audio' && (
                <AudioMixingBoard
                  projectId={projectId.current}
                  projectDuration={recipe.durationSeconds}
                  onTracksApplied={handleAudioTracksApplied}
                />
              )}
              {activeTab === 'locations' && <LocationPanel />}
              </Suspense>
            </div>
          )}

          {/* Drag-to-resize handle — right edge */}
          {!leftCollapsed && !(activePanel && !FILM_PANEL_IDS.has(activePanel)) && (
            <div
              onMouseDown={startLeftResize}
              className="absolute bottom-0 right-0 top-0 z-30 w-2 cursor-col-resize group"
              title="Drag to resize panel"
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 h-12 w-0.5 rounded-full bg-[#00e5c8]/0 group-hover:bg-[#00e5c8]/50 transition-colors duration-150" />
            </div>
          )}
        </div>

        {/* Centre: video preview + timeline */}
        <div className="relative z-10 flex flex-col flex-1 overflow-hidden min-w-0">
          <InteractivePlayer
            clips={allClips}
            tracks={recipe.tracks}
            playheadTime={playheadTime}
            isPlaying={isPlaying}
            duration={timelineDuration}
            activeJobs={activeJobs}
            onPlayPause={() => setIsPlaying((p) => !p)}
            onSeek={setPlayheadTime}
            onSkipToStart={() => setPlayheadTime(0)}
            onSkipToEnd={() => setPlayheadTime(timelineDuration)}
            onPlaybackEnded={handlePlaybackEnded}
            onClipEdited={(clipId, url) => handleClipUpdate(clipId, { sourceUrl: url })}
          />

          <Timeline
            recipe={recipe}
            playheadTime={playheadTime}
            selectedClipId={selectedClipId}
            zoomLevel={zoomLevel}
            scrollOffset={scrollOffset}
            activeJobs={activeJobs}
            onSeek={setPlayheadTime}
            onClipSelect={setSelectedClipId}
            onClipMove={handleClipMove}
            onClipTrim={handleClipTrim}
            onTrackToggleMute={handleTrackToggleMute}
            onZoomChange={setZoomLevel}
            onScrollChange={setScrollOffset}
          />
        </div>

        {/* Right: properties */}
        {!rightCollapsed && (
          <div className="flex-shrink-0 border-l border-[var(--border)] bg-[var(--bg-elevated)] overflow-hidden" style={{ width: 220 }}>
            <PropertiesPanel
              selectedClip={selectedClip}
              recipe={recipe}
              onOpenRepaint={setRepaintClip}
              onClipUpdate={handleClipUpdate}
            />
          </div>
        )}
        <button
          onClick={() => setRightCollapsed((v) => !v)}
          className="flex-shrink-0 w-5 border-l border-[var(--border)] flex items-center justify-center
            text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] transition-colors"
          title={rightCollapsed ? 'Show properties' : 'Hide properties'}
        >
          {rightCollapsed ? <ChevronLeft className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        </button>
      </div>

      {/* RepaintModal */}
      {repaintClip && (
        <RepaintModal
          clip={repaintClip}
          surroundingClips={allClips
            .filter((c) => c.id !== repaintClip.id && c.trackId === repaintClip.trackId)
            .sort((a, b) => Math.abs(a.startTime - repaintClip.startTime) - Math.abs(b.startTime - repaintClip.startTime))
            .slice(0, 4)}
          onClose={() => setRepaintClip(null)}
          onRepaintComplete={(clipId, newUrl) => { handleClipUpdate(clipId, { sourceUrl: newUrl }); setRepaintClip(null) }}
        />
      )}

      <ReviewPortalModal projectId={projectId.current} />
    </div>
  )
}
