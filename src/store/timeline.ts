/**
 * Shared timeline store — Simple-mode "+ Timeline" and the editor read the same clips.
 * Syncs into playbackStore (TimelineRecipe) so Advanced/Ultimate timelines stay populated.
 */

import { create } from 'zustand'
import { appendTimelineClipToPlayback } from '@/lib/timeline/syncToPlayback'

export interface TimelineClip {
  id: string
  sourceUrl: string
  posterUrl?: string
  startSec: number
  durationSec: number
  track: 'video' | 'audio'
  label?: string
}

interface TimelineState {
  clips: TimelineClip[]
  playheadSec: number
  isPlaying: boolean

  addClip: (clip: Omit<TimelineClip, 'startSec'> & { startSec?: number }) => void
  removeClip: (id: string) => void
  updateClip: (id: string, patch: Partial<TimelineClip>) => void
  clear: () => void

  setPlayhead: (sec: number) => void
  setPlaying: (playing: boolean) => void

  timelineEnd: () => number
  totalDuration: () => number
}

export const useTimelineStore = create<TimelineState>((set, get) => ({
  clips: [],
  playheadSec: 0,
  isPlaying: false,

  addClip: (clip) => {
    console.log('addClip input', {
      id: clip.id,
      sourceUrl: clip.sourceUrl,
      hasUrl: Boolean(clip.sourceUrl),
    })
    if (!clip.sourceUrl) {
      console.error('addClip REJECTED: no sourceUrl', clip)
      return
    }
    if (!clip.durationSec || clip.durationSec <= 0 || clip.durationSec > 3600) {
      console.warn('addClip_suspect_duration', { id: clip.id, durationSec: clip.durationSec })
    }
    const startSec = clip.startSec ?? get().timelineEnd()
    const entry: TimelineClip = { ...clip, startSec, track: clip.track ?? 'video' }
    set((s) => ({ clips: [...s.clips.filter((c) => c.id !== entry.id), entry] }))
    appendTimelineClipToPlayback(entry)
  },

  removeClip: (id) => set((s) => ({ clips: s.clips.filter((c) => c.id !== id) })),

  updateClip: (id, patch) =>
    set((s) => ({
      clips: s.clips.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })),

  clear: () => set({ clips: [], playheadSec: 0, isPlaying: false }),

  setPlayhead: (sec) => set({ playheadSec: sec }),
  setPlaying: (playing) => set({ isPlaying: playing }),

  timelineEnd: () => {
    const video = get().clips.filter((c) => c.track === 'video')
    if (video.length === 0) return 0
    return Math.max(...video.map((c) => c.startSec + c.durationSec))
  },

  totalDuration: () => {
    const all = get().clips
    if (all.length === 0) return 0
    return Math.max(...all.map((c) => c.startSec + c.durationSec))
  },
}))
