'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Volume2, VolumeX, Lock, Unlock, Eye } from 'lucide-react'
import { TRACK_LABEL_WIDTH, RULER_HEIGHT, TRACK_HEIGHT, MODEL_CLIP_COLOURS, TRACK_COLOURS } from './constants'
import type { TimelineRecipe, Track, Clip } from '@/lib/timeline/schema'
import { clipPosterUrl, computeTimelineDuration, isVideoMediaUrl } from '@/lib/timeline/playback'

interface ActiveJob { jobId: string; clipId: string; progress?: number }

interface Props {
  recipe: TimelineRecipe | null
  playheadTime: number
  selectedClipId: string | null
  zoomLevel: number
  scrollOffset: number
  activeJobs: ActiveJob[]
  onSeek: (t: number) => void
  onClipSelect: (id: string | null) => void
  onClipMove: (clipId: string, newStart: number, targetTrackId: string) => void
  onClipTrim: (clipId: string, edge: 'start' | 'end', newTime: number) => void
  onTrackToggleMute: (trackId: string) => void
  onZoomChange: (zoom: number) => void
  onScrollChange: (offset: number) => void
}

function timeToX(t: number, zoom: number, scroll: number): number {
  return t * zoom - scroll
}

function xToTime(x: number, zoom: number, scroll: number): number {
  return (x + scroll) / zoom
}

function formatRulerTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return m > 0 ? `${m}:${String(s).padStart(2, '0')}` : `${s}s`
}

export function Timeline({
  recipe,
  playheadTime,
  selectedClipId,
  zoomLevel,
  scrollOffset,
  activeJobs,
  onSeek,
  onClipSelect,
  onClipMove,
  onClipTrim,
  onTrackToggleMute,
  onZoomChange,
  onScrollChange,
}: Props) {
  const rulerRef = useRef<HTMLDivElement>(null)
  const timelineRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState<{
    type: 'clip' | 'trim-start' | 'trim-end' | 'playhead'
    clipId?: string
    startX: number
    startTime: number
    trackId?: string
  } | null>(null)
  const [hoveredClipId, setHoveredClipId] = useState<string | null>(null)

  const tracks = recipe?.tracks ?? []
  const totalDuration = computeTimelineDuration(tracks, recipe?.durationSeconds ?? 60)

  // Ruler tick marks
  const tickInterval = zoomLevel >= 100 ? 1 : zoomLevel >= 40 ? 5 : 10
  const ticks: number[] = []
  for (let t = 0; t <= totalDuration; t += tickInterval) ticks.push(t)

  // Handle ruler click → seek
  const handleRulerClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const contentX = x - TRACK_LABEL_WIDTH
    if (contentX < 0) return
    onSeek(xToTime(contentX, zoomLevel, scrollOffset))
  }, [zoomLevel, scrollOffset, onSeek])

  // Zoom with scroll wheel + modifier
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = -e.deltaY * 0.5
      onZoomChange(Math.max(20, Math.min(400, zoomLevel + delta)))
    } else {
      onScrollChange(Math.max(0, scrollOffset + e.deltaX || e.deltaY))
    }
  }, [zoomLevel, scrollOffset, onZoomChange, onScrollChange])

  useEffect(() => {
    const el = timelineRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  // Mouse events for drag/trim
  const handleMouseDown = useCallback((
    e: React.MouseEvent,
    type: 'clip' | 'trim-start' | 'trim-end',
    clip: Clip,
  ) => {
    e.preventDefault()
    e.stopPropagation()
    onClipSelect(clip.id)
    setDragging({
      type,
      clipId: clip.id,
      startX: e.clientX,
      startTime: type === 'clip' ? clip.startTime : type === 'trim-start' ? clip.startTime : clip.endTime,
      trackId: clip.trackId,
    })
  }, [onClipSelect])

  useEffect(() => {
    if (!dragging) return

    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging.clipId || !recipe) return
      const dx = e.clientX - dragging.startX
      const dt = dx / zoomLevel

      if (dragging.type === 'clip') {
        const newStart = Math.max(0, dragging.startTime + dt)
        onClipMove(dragging.clipId, newStart, dragging.trackId!)
      } else if (dragging.type === 'trim-start') {
        onClipTrim(dragging.clipId, 'start', Math.max(0, dragging.startTime + dt))
      } else if (dragging.type === 'trim-end') {
        onClipTrim(dragging.clipId, 'end', Math.max(0, dragging.startTime + dt))
      }
    }

    const handleMouseUp = () => setDragging(null)

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragging, zoomLevel, recipe, onClipMove, onClipTrim])

  // Playhead drag
  const playheadX = timeToX(playheadTime, zoomLevel, scrollOffset) + TRACK_LABEL_WIDTH

  const clipJobMap = new Map(activeJobs.map((j) => [j.clipId, j]))

  return (
    <div
      ref={timelineRef}
      className="flex flex-col flex-1 overflow-hidden bg-[#0c0c14] select-none"
    >
      {/* Ruler */}
      <div
        ref={rulerRef}
        className="flex-shrink-0 relative border-b border-white/8 bg-[#0a0a12] cursor-pointer"
        style={{ height: RULER_HEIGHT }}
        onClick={handleRulerClick}
      >
        {/* Track label spacer */}
        <div className="absolute left-0 top-0 bottom-0 border-r border-white/8" style={{ width: TRACK_LABEL_WIDTH }} />

        {/* Tick marks */}
        {ticks.map((t) => {
          const x = timeToX(t, zoomLevel, scrollOffset) + TRACK_LABEL_WIDTH
          if (x < TRACK_LABEL_WIDTH || x > 4000) return null
          return (
            <div key={t} className="absolute top-0 flex flex-col" style={{ left: x }}>
              <div className="w-px h-3 bg-white/20" />
              <span className="text-[9px] text-white/30 ml-1 mt-0.5 select-none">{formatRulerTime(t)}</span>
            </div>
          )
        })}

        {/* Playhead triangle on ruler */}
        <div
          className="absolute top-0 w-2.5 h-full flex flex-col items-center pointer-events-none"
          style={{ left: playheadX - 5 }}
        >
          <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[8px] border-l-transparent border-r-transparent border-t-teal-500" />
          <div className="w-px flex-1 bg-[#00e5c8]/60" />
        </div>
      </div>

      {/* Track rows */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {tracks.map((track) => (
          <TrackRow
            key={track.id}
            track={track}
            zoomLevel={zoomLevel}
            scrollOffset={scrollOffset}
            selectedClipId={selectedClipId}
            hoveredClipId={hoveredClipId}
            playheadX={playheadX}
            clipJobMap={clipJobMap}
            onClipSelect={onClipSelect}
            onMouseDown={handleMouseDown}
            onHover={setHoveredClipId}
            onToggleMute={() => onTrackToggleMute(track.id)}
          />
        ))}
      </div>

      {/* Playhead line (full height) */}
      <div
        className="absolute top-0 bottom-0 w-px bg-[#00e5c8]/50 pointer-events-none z-10"
        style={{ left: playheadX }}
      />
    </div>
  )
}

interface TrackRowProps {
  track: Track
  zoomLevel: number
  scrollOffset: number
  selectedClipId: string | null
  hoveredClipId: string | null
  playheadX: number
  clipJobMap: Map<string, ActiveJob>
  onClipSelect: (id: string | null) => void
  onMouseDown: (e: React.MouseEvent, type: 'clip' | 'trim-start' | 'trim-end', clip: Clip) => void
  onHover: (id: string | null) => void
  onToggleMute: () => void
}

function TrackRow({
  track,
  zoomLevel,
  scrollOffset,
  selectedClipId,
  hoveredClipId,
  playheadX,
  clipJobMap,
  onClipSelect,
  onMouseDown,
  onHover,
  onToggleMute,
}: TrackRowProps) {
  const colour = TRACK_COLOURS[track.label] ?? '#6b7280'
  const isAudio = track.type === 'audio'

  return (
    <div
      className="flex border-b border-white/5 hover:bg-white/[0.015] transition-colors"
      style={{ height: TRACK_HEIGHT }}
    >
      {/* Label column */}
      <div
        className="flex-shrink-0 flex items-center gap-2 px-2 border-r border-white/8"
        style={{ width: TRACK_LABEL_WIDTH }}
      >
        <div className="w-1.5 h-6 rounded-sm flex-shrink-0" style={{ backgroundColor: colour }} />
        <span className="text-[9px] text-white/45 font-medium truncate flex-1">{track.label}</span>
        <button
          onClick={onToggleMute}
          className={`flex-shrink-0 transition-colors ${track.muted ? 'text-red-400' : 'text-white/20 hover:text-white/60'}`}
          title={track.muted ? 'Unmute' : 'Mute'}
        >
          {track.muted ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
        </button>
      </div>

      {/* Clip area */}
      <div className="flex-1 relative overflow-hidden" onClick={() => onClipSelect(null)}>
        {track.clips.map((clip) => {
          const x = timeToX(clip.startTime, zoomLevel, scrollOffset)
          const w = (clip.endTime - clip.startTime) * zoomLevel
          if (x + w < 0 || x > 4000) return null

          const isSelected = clip.id === selectedClipId
          const isHovered = clip.id === hoveredClipId
          const activeJob = clipJobMap.get(clip.id)
          const isGenerating = Boolean(activeJob)
          const clipColour = clip.modelUsed ? (MODEL_CLIP_COLOURS[clip.modelUsed] ?? colour + '80') : colour + '60'

          return (
            <div
              key={clip.id}
              className={`
                absolute top-1.5 rounded-md cursor-grab active:cursor-grabbing
                flex items-center overflow-hidden
                border transition-all duration-100
                ${isSelected ? 'ring-1 ring-teal-500 border-[#00e5c8] z-20' : isHovered ? 'border-white/40 z-10' : 'border-transparent'}
                ${isGenerating ? 'border-[#00e5c8]/40 animate-pulse-subtle' : ''}
              `}
              style={{
                left: Math.max(0, x),
                width: Math.max(20, w - 2),
                height: TRACK_HEIGHT - 12,
                backgroundColor: clipColour,
              }}
              onMouseDown={(e) => onMouseDown(e, 'clip', clip)}
              onMouseEnter={() => onHover(clip.id)}
              onMouseLeave={() => onHover(null)}
            >
              {/* Trim handle start */}
              <div
                className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-30
                  bg-black/30 hover:bg-[#00e5c8]/40 transition-colors"
                onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, 'trim-start', clip) }}
              />

              {/* Content */}
              <div className="flex-1 px-2 min-w-0 relative h-full">
                {isGenerating ? (
                  <div className="flex items-center gap-1 h-full">
                    <div className="w-2 h-2 rounded-full bg-[#00f0d5] animate-pulse" />
                    <span className="text-[9px] text-white/80 truncate">
                      ⟳ {activeJob?.progress != null ? `${activeJob.progress}%` : 'Generating…'}
                    </span>
                  </div>
                ) : !clip.sourceUrl || !isVideoMediaUrl(clip.sourceUrl) ? (
                  <div className="flex items-center h-full text-[9px] text-red-300/90 truncate">
                    ⚠ no media — re-render
                  </div>
                ) : (
                  <>
                    {clipPosterUrl(clip) && w > 40 && (
                      <img
                        src={clipPosterUrl(clip)}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none rounded-sm"
                      />
                    )}
                    <span className="relative z-[1] text-[9px] text-white/90 truncate block leading-none drop-shadow">
                      {clip.prompt ? clip.prompt.slice(0, 30) : clip.modelUsed ?? 'Clip'}
                    </span>
                  </>
                )}
                {isAudio && (
                  <div className="flex gap-0.5 mt-1 h-2 items-end">
                    {Array.from({ length: Math.floor(w / 4) }, (_, i) => (
                      <div
                        key={i}
                        className="w-px bg-white/30 rounded-sm"
                        style={{ height: `${20 + Math.sin(i * 0.8) * 60 + 20}%` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Model badge */}
              {clip.modelUsed && w > 60 && (
                <div className="absolute top-0.5 right-1.5 text-[8px] text-white/50 font-medium bg-black/30 px-1 rounded">
                  {clip.modelUsed.replace('_', ' ')}
                </div>
              )}

              {/* Trim handle end */}
              <div
                className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-30
                  bg-black/30 hover:bg-[#00e5c8]/40 transition-colors"
                onMouseDown={(e) => { e.stopPropagation(); onMouseDown(e, 'trim-end', clip) }}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
