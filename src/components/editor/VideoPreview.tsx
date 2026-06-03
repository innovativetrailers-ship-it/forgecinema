'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { Play, Pause, SkipBack, SkipForward, Maximize2, Loader2 } from 'lucide-react'
import { PREVIEW_HEIGHT } from './constants'
import type { Clip, Track } from '@/lib/timeline/schema'

interface ActiveJob {
  jobId: string
  clipId: string
  progress?: number
  message?: string
}

interface Props {
  clips: Clip[]
  /** Full track list — enables multi-track audio mixing (music/voice/sfx). Optional: omit for video-only preview. */
  tracks?: Track[]
  playheadTime: number
  isPlaying: boolean
  duration: number
  activeJobs: ActiveJob[]
  onPlayPause: () => void
  onSeek: (t: number) => void
  onSkipToStart: () => void
  onSkipToEnd: () => void
}

function formatTimecode(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const f = Math.floor((seconds % 1) * 24)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}:${String(f).padStart(2, '0')}`
}

export function VideoPreview({
  clips,
  tracks,
  playheadTime,
  isPlaying,
  duration,
  activeJobs,
  onPlayPause,
  onSeek,
  onSkipToStart,
  onSkipToEnd,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const audioRefs = useRef<Map<string, HTMLAudioElement>>(new Map())

  // Find current clip at playhead (video clips only, identified by having a sourceUrl that looks like video)
  const currentClip = clips
    .filter((c) => c.sourceUrl && c.startTime <= playheadTime && c.endTime >= playheadTime)
    .sort((a, b) => b.startTime - a.startTime)[0]

  const hasGenerating = activeJobs.length > 0

  useEffect(() => {
    const video = videoRef.current
    if (!video || !currentClip?.sourceUrl) return

    if (video.src !== currentClip.sourceUrl) {
      video.src = currentClip.sourceUrl
      video.currentTime = playheadTime - currentClip.startTime
    }

    if (isPlaying) {
      video.play().catch(() => {})
    } else {
      video.pause()
      video.currentTime = playheadTime - currentClip.startTime
    }
  }, [currentClip, isPlaying, playheadTime])

  // Multi-track audio mixer: play + sync every active audio-track clip alongside
  // the video, using one <audio> element per clip. No-op unless `tracks` is passed.
  useEffect(() => {
    const audioTracks = (tracks ?? []).filter((t) => t.type === 'audio' && !t.muted)
    const active = audioTracks.flatMap((t) =>
      t.clips
        .filter((c) => c.sourceUrl && c.startTime <= playheadTime && c.endTime >= playheadTime)
        .map((c) => ({ clip: c, track: t })),
    )
    const activeIds = new Set(active.map((a) => a.clip.id))

    // Stop audio that is no longer under the playhead
    audioRefs.current.forEach((el, id) => {
      if (!activeIds.has(id)) { el.pause(); audioRefs.current.delete(id) }
    })

    for (const { clip, track } of active) {
      let el = audioRefs.current.get(clip.id)
      if (!el) {
        el = new Audio(clip.sourceUrl)
        audioRefs.current.set(clip.id, el)
      }
      const raw = clip.audioSettings?.volume ?? track.volume ?? 1
      el.volume = Math.max(0, Math.min(1, raw > 1 ? raw / 100 : raw))
      const target = playheadTime - clip.startTime
      if (Math.abs(el.currentTime - target) > 0.2) el.currentTime = target
      if (isPlaying && el.paused) el.play().catch(() => {})
      if (!isPlaying && !el.paused) el.pause()
    }
  }, [tracks, playheadTime, isPlaying])

  // Pause + release all audio elements on unmount
  useEffect(() => {
    const refs = audioRefs.current
    return () => { refs.forEach((el) => el.pause()); refs.clear() }
  }, [])

  const handleTimeUpdate = useCallback(() => {
    if (!videoRef.current || !currentClip) return
    onSeek(currentClip.startTime + videoRef.current.currentTime)
  }, [currentClip, onSeek])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative flex flex-col bg-black border-b border-white/8"
      style={{ height: PREVIEW_HEIGHT }}
    >
      {/* Video frame */}
      <div className="flex-1 relative flex items-center justify-center bg-[#050508]">
        {currentClip?.sourceUrl ? (
          <video
            ref={videoRef}
            className="max-w-full max-h-full object-contain"
            onTimeUpdate={handleTimeUpdate}
            muted={false}
          />
        ) : (
          <div className="text-white/15 text-sm">No content at playhead</div>
        )}

        {/* Timecode overlay */}
        <div className="absolute top-2 left-3 font-mono text-xs text-white/70 bg-black/60 px-2 py-0.5 rounded">
          {formatTimecode(playheadTime)}
        </div>

        {/* Generating badge */}
        {hasGenerating && (
          <div className="absolute top-2 right-3 flex items-center gap-1.5 bg-[#00e5c8]/20 border border-[#00e5c8]/30
            text-[#00e5c8] text-[10px] px-2.5 py-1 rounded-full font-medium">
            <Loader2 className="w-2.5 h-2.5 animate-spin" />
            {activeJobs.length} generating
            {activeJobs[0]?.progress !== undefined && ` · ${activeJobs[0].progress}%`}
          </div>
        )}

        {/* Fullscreen button */}
        <button
          onClick={toggleFullscreen}
          className="absolute bottom-2 right-3 p-1.5 rounded-lg bg-black/60 text-white/50
            hover:text-white hover:bg-black/80 transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-1 py-2 bg-[#0a0a12] border-t border-white/5">
        {/* Skip to start */}
        <button
          onClick={onSkipToStart}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
          title="Skip to start (Home)"
        >
          <SkipBack className="w-3.5 h-3.5" />
        </button>

        {/* Play/pause */}
        <button
          onClick={onPlayPause}
          className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#00e5c8]/20 text-white/80 hover:text-[#00e5c8]
            flex items-center justify-center transition-all"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying
            ? <Pause className="w-3.5 h-3.5" fill="currentColor" />
            : <Play className="w-3.5 h-3.5 ml-0.5" fill="currentColor" />}
        </button>

        {/* Skip to end */}
        <button
          onClick={onSkipToEnd}
          className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors"
          title="Skip to end (End)"
        >
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        {/* Duration */}
        <span className="absolute right-4 font-mono text-[10px] text-white/30">
          {formatTimecode(duration)}
        </span>
      </div>
    </div>
  )
}
