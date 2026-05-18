'use client'

import { useEditorStore } from '@/store/editor'
import { useCallback } from 'react'
import { nanoid } from 'nanoid'
import type { Track, TimelineClip } from '@/lib/models/types'

export function useTimeline() {
  const {
    timeline,
    selectedClipId,
    playheadTime,
    isPlaying,
    zoom,
    setTimeline,
    selectClip,
    setPlayheadTime,
    setIsPlaying,
    setZoom,
    addTrack,
    removeTrack,
    addClipToTrack,
    updateClip,
    removeClip,
    reorderTracks,
  } = useEditorStore()

  const initTimeline = useCallback(
    (fps: number = 24, resolution: string = '1920x1080') => {
      const defaultTracks: Track[] = [
        { id: nanoid(), type: 'video', name: 'VIDEO 1', clips: [] },
        { id: nanoid(), type: 'video', name: 'VIDEO 2', clips: [] },
        { id: nanoid(), type: 'fx', name: 'VFX', clips: [] },
        { id: nanoid(), type: 'audio', name: 'MUSIC', clips: [], volume: 80 },
        { id: nanoid(), type: 'audio', name: 'VOICE', clips: [], volume: 100 },
        { id: nanoid(), type: 'audio', name: 'SFX', clips: [], volume: 70 },
      ]
      setTimeline({
        id: nanoid(),
        fps,
        resolution,
        durationSeconds: 0,
        tracks: defaultTracks,
      })
    },
    [setTimeline]
  )

  const appendClip = useCallback(
    (trackId: string, sourceUrl: string, duration: number, type: TimelineClip['type'] = 'video') => {
      const track = timeline?.tracks.find((t) => t.id === trackId)
      if (!track) return

      const startTime = track.clips.reduce(
        (max, c) => Math.max(max, c.startTime + c.duration),
        0
      )

      const clip: TimelineClip = {
        id: nanoid(),
        trackId,
        startTime,
        duration,
        sourceUrl,
        type,
      }

      addClipToTrack(trackId, clip)
      return clip
    },
    [timeline, addClipToTrack]
  )

  const getSelectedClip = useCallback(() => {
    if (!selectedClipId || !timeline) return null
    for (const track of timeline.tracks) {
      const clip = track.clips.find((c) => c.id === selectedClipId)
      if (clip) return clip
    }
    return null
  }, [selectedClipId, timeline])

  const totalDuration = timeline?.tracks.reduce((max, t) => {
    const trackEnd = t.clips.reduce((m, c) => Math.max(m, c.startTime + c.duration), 0)
    return Math.max(max, trackEnd)
  }, 0) ?? 0

  return {
    timeline,
    selectedClipId,
    playheadTime,
    isPlaying,
    zoom,
    totalDuration,
    initTimeline,
    appendClip,
    getSelectedClip,
    selectClip,
    setPlayheadTime,
    setIsPlaying,
    setZoom,
    addTrack,
    removeTrack,
    updateClip,
    removeClip,
    reorderTracks,
  }
}
