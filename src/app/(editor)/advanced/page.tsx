'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { nanoid } from 'nanoid'

import { TopBar } from '@/components/layout/TopBar'
import { IconRail } from '@/components/layout/IconRail'
import { LeftPanel } from '@/components/layout/LeftPanel'
import { RightPanel } from '@/components/layout/RightPanel'
import { VideoPreview } from '@/components/editor/VideoPreview'
import { Timeline } from '@/components/editor/Timeline'
import { RepaintModal } from '@/components/editor/RepaintModal'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { useStudioStore } from '@/store/editor'
import { useUIStore } from '@/store/ui'
import { useCredits } from '@/hooks/useCredits'
import { toast } from '@/lib/toast'
import { DEFAULT_ZOOM } from '@/components/editor/constants'
import type { TimelineRecipe, Clip, Track } from '@/lib/timeline/schema'

// Default 8-track timeline scaffold
const DEFAULT_TRACKS: Track[] = [
  { id: 't-v1', type: 'video', label: 'VIDEO 1', muted: false, locked: false, solo: false, clips: [] },
  { id: 't-v2', type: 'video', label: 'VIDEO 2', muted: false, locked: false, solo: false, clips: [] },
  { id: 't-vfx', type: 'vfx', label: 'VFX', muted: false, locked: false, solo: false, clips: [] },
  { id: 't-cgi', type: 'cgi', label: 'CGI', muted: false, locked: false, solo: false, clips: [] },
  { id: 't-music', type: 'audio', label: 'MUSIC', muted: false, locked: false, solo: false, volume: 0.8, clips: [] },
  { id: 't-voice', type: 'audio', label: 'VOICE', muted: false, locked: false, solo: false, volume: 1, clips: [] },
  { id: 't-sfx', type: 'audio', label: 'SFX', muted: false, locked: false, solo: false, volume: 0.6, clips: [] },
  { id: 't-cap', type: 'caption', label: 'CAPTIONS', muted: false, locked: false, solo: false, clips: [] },
]

function buildDefaultRecipe(projectId: string): TimelineRecipe {
  return {
    id: nanoid(),
    projectId,
    fps: 24,
    resolution: { width: 1920, height: 1080 },
    durationSeconds: 60,
    colorSpace: 'rec709',
    tracks: DEFAULT_TRACKS,
  }
}

interface ActiveJob {
  jobId: string
  clipId: string
  trackId: string
  progress: number
  message: string
}

interface Character { id: string; name: string; loraStatus: string; referenceUrls: string[]; modelFamily?: string | null; renderCount: number }
interface Location { id: string; name: string }

export default function AdvancedPage() {
  const { data: session } = useSession()
  const { balance: creditBalance } = useCredits()
  const projectId = useRef(nanoid())
  const { activeModal, modalPayload, closeModal } = useUIStore()

  const [recipe, setRecipe] = useState<TimelineRecipe>(() => buildDefaultRecipe(projectId.current))
  const [playheadTime, setPlayheadTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [selectedClipId, setSelectedClipId] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ZOOM)
  const [scrollOffset, setScrollOffset] = useState(0)
  // activeTool and activePanel now managed by UIStore / TopBar / IconRail
  const [repaintClip, setRepaintClip] = useState<Clip | null>(null)
  const [activeJobs, setActiveJobs] = useState<ActiveJob[]>([])
  const [characters, setCharacters] = useState<Character[]>([])
  const [locations, setLocations] = useState<Location[]>([])
  const [isExporting, setIsExporting] = useState(false)

  // History stack for undo/redo
  const historyRef = useRef<TimelineRecipe[]>([])
  const historyIndexRef = useRef(-1)

  const commitHistory = useCallback((newRecipe: TimelineRecipe) => {
    const stack = historyRef.current.slice(0, historyIndexRef.current + 1)
    stack.push(newRecipe)
    historyRef.current = stack.slice(-50)
    historyIndexRef.current = historyRef.current.length - 1
    setRecipe(newRecipe)
  }, [])

  const undo = useCallback(() => {
    if (historyIndexRef.current <= 0) return
    historyIndexRef.current -= 1
    setRecipe(historyRef.current[historyIndexRef.current])
  }, [])

  const redo = useCallback(() => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return
    historyIndexRef.current += 1
    setRecipe(historyRef.current[historyIndexRef.current])
  }, [])

  // Load characters + locations
  useEffect(() => {
    if (!session) return
    Promise.all([
      fetch('/api/vault/character/list').then((r) => r.json()),
      fetch('/api/vault/location/list').then((r) => r.json()),
    ]).then(([chars, locs]) => {
      setCharacters((chars as { characters: Character[] }).characters ?? [])
      setLocations((locs as { locations: Location[] }).locations ?? [])
    }).catch(console.error)
  }, [session])

  // Playback ticker
  useEffect(() => {
    if (!isPlaying) return
    const raf = setInterval(() => {
      setPlayheadTime((t) => {
        const next = t + 1 / recipe.fps
        if (next >= recipe.durationSeconds) {
          setIsPlaying(false)
          return 0
        }
        return next
      })
    }, 1000 / recipe.fps)
    return () => clearInterval(raf)
  }, [isPlaying, recipe.fps, recipe.durationSeconds])

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      if (e.code === 'Space') { e.preventDefault(); setIsPlaying((p) => !p) }
      if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo() }
      if ((e.metaKey || e.ctrlKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo() }
      // Tool switching now handled by TopBar keyboard handler
      if (e.key === 'Home') setPlayheadTime(0)
      if (e.key === 'End') setPlayheadTime(recipe.durationSeconds)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo, recipe.durationSeconds])

  // All clips flat (for preview + repaint)
  const allClips = recipe.tracks.flatMap((t) => t.clips)
  const selectedClip = selectedClipId ? allClips.find((c) => c.id === selectedClipId) ?? null : null

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
    const updated = { ...recipe }
    updated.tracks = recipe.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((c) => {
        if (c.id !== clipId) return c
        if (edge === 'start') return { ...c, startTime: Math.min(newTime, c.endTime - 0.5) }
        return { ...c, endTime: Math.max(newTime, c.startTime + 0.5) }
      }),
    }))
    commitHistory(updated)
  }, [recipe, commitHistory])

  const handleClipUpdate = useCallback((clipId: string, updates: Partial<Clip>) => {
    const updated = { ...recipe }
    updated.tracks = recipe.tracks.map((track) => ({
      ...track,
      clips: track.clips.map((c) => c.id === clipId ? { ...c, ...updates } : c),
    }))
    commitHistory(updated)
  }, [recipe, commitHistory])

  const handleTrackToggleMute = useCallback((trackId: string) => {
    const updated = {
      ...recipe,
      tracks: recipe.tracks.map((t) => t.id === trackId ? { ...t, muted: !t.muted } : t),
    }
    commitHistory(updated)
  }, [recipe, commitHistory])

  const handleTransitionSelect = useCallback((transitionId: string) => {
    if (!selectedClipId) return
    handleClipUpdate(selectedClipId, {
      transition: { type: transitionId as never, duration: 0.5 },
    })
  }, [selectedClipId, handleClipUpdate])

  // Job creation → add placeholder clip with SSE progress tracking
  const handleJobCreated = useCallback((jobId: string, clipData: Record<string, unknown>) => {
    const clipId = nanoid()
    const trackId = 't-v1'
    const duration = (clipData.duration as number) ?? 5

    // Calculate start time (after last clip on track)
    const mainTrack = recipe.tracks.find((t) => t.id === trackId)
    const lastEnd = mainTrack?.clips.reduce((max, c) => Math.max(max, c.endTime), 0) ?? 0

    const placeholderClip: Clip = {
      id: clipId,
      trackId,
      startTime: lastEnd,
      endTime: lastEnd + duration,
      sourceUrl: '',
      modelUsed: clipData.model as string,
      prompt: clipData.prompt as string,
    }

    const updated = {
      ...recipe,
      tracks: recipe.tracks.map((t) =>
        t.id === trackId ? { ...t, clips: [...t.clips, placeholderClip] } : t
      ),
    }
    commitHistory(updated)

    // Track active job
    setActiveJobs((jobs) => [...jobs, { jobId, clipId, trackId, progress: 0, message: 'Queued' }])

    // Subscribe via SSE
    const sse = new EventSource(`/api/jobs/${jobId}/stream`)
    sse.onmessage = (e) => {
      const data = JSON.parse(e.data) as { status: string; progress?: number; message?: string; outputUrl?: string }
      setActiveJobs((jobs) => jobs.map((j) =>
        j.jobId === jobId ? { ...j, progress: data.progress ?? j.progress, message: data.message ?? j.message } : j
      ))
      if (data.status === 'complete' && data.outputUrl) {
        setRecipe((current) => ({
          ...current,
          tracks: current.tracks.map((t) => ({
            ...t,
            clips: t.clips.map((c) => c.id === clipId ? { ...c, sourceUrl: data.outputUrl! } : c),
          })),
        }))
        setActiveJobs((jobs) => jobs.filter((j) => j.jobId !== jobId))
        sse.close()
      } else if (data.status === 'failed') {
        setActiveJobs((jobs) => jobs.filter((j) => j.jobId !== jobId))
        sse.close()
      }
    }
    sse.onerror = () => {
      setActiveJobs((jobs) => jobs.filter((j) => j.jobId !== jobId))
      sse.close()
    }
  }, [recipe, commitHistory])

  // Repaint complete → update clip URL
  const handleRepaintComplete = useCallback((clipId: string, newVideoUrl: string) => {
    handleClipUpdate(clipId, { sourceUrl: newVideoUrl })
    setRepaintClip(null)
  }, [handleClipUpdate])

  // Export
  const handleExport = async () => {
    setIsExporting(true)
    try {
      const res = await fetch('/api/timeline/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe }),
      })
      const { jobId } = await res.json() as { jobId: string }
      const sse = new EventSource(`/api/jobs/${jobId}/stream`)
      sse.onmessage = (e) => {
        const data = JSON.parse(e.data) as { status: string; outputUrl?: string }
        if (data.status === 'complete' && data.outputUrl) {
          window.open(data.outputUrl, '_blank')
          setIsExporting(false)
          sse.close()
        } else if (data.status === 'failed') {
          setIsExporting(false)
          sse.close()
        }
      }
    } catch { setIsExporting(false) }
  }

  return (
    <div className="flex flex-col h-screen bg-[var(--bg-base)] text-[var(--text-primary)] overflow-hidden">
      <TopBar />

      {/* Main body */}
      <div className="flex flex-1 overflow-hidden">
        <IconRail />
        <LeftPanel />

        {/* Centre: preview + timeline */}
        <div className="flex flex-col flex-1 overflow-hidden">
          <VideoPreview
            clips={allClips}
            playheadTime={playheadTime}
            isPlaying={isPlaying}
            duration={recipe.durationSeconds}
            activeJobs={activeJobs}
            onPlayPause={() => setIsPlaying((p) => !p)}
            onSeek={setPlayheadTime}
            onSkipToStart={() => setPlayheadTime(0)}
            onSkipToEnd={() => setPlayheadTime(recipe.durationSeconds)}
          />

          <ErrorBoundary>
            <Timeline
              recipe={recipe}
              playheadTime={playheadTime}
              selectedClipId={selectedClipId}
              zoomLevel={zoomLevel}
              scrollOffset={scrollOffset}
              activeJobs={activeJobs}
              onSeek={setPlayheadTime}
              onClipSelect={(id) => { setSelectedClipId(id); useStudioStore.getState().selectClip(id) }}
              onClipMove={handleClipMove}
              onClipTrim={handleClipTrim}
              onTrackToggleMute={handleTrackToggleMute}
              onZoomChange={setZoomLevel}
              onScrollChange={setScrollOffset}
            />
          </ErrorBoundary>
        </div>

        <RightPanel />
      </div>

      {repaintClip && (
        <RepaintModal
          clip={repaintClip}
          surroundingClips={allClips
            .filter((c) => c.id !== repaintClip.id && c.trackId === repaintClip.trackId)
            .sort((a, b) => Math.abs(a.startTime - repaintClip.startTime) - Math.abs(b.startTime - repaintClip.startTime))
            .slice(0, 4)}
          onClose={() => { setRepaintClip(null); closeModal() }}
          onRepaintComplete={handleRepaintComplete}
        />
      )}
    </div>
  )
}
