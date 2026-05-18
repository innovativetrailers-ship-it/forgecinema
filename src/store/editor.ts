import { create } from 'zustand'
import { nanoid } from 'nanoid'

// ─── Core types ───────────────────────────────────────────────────────────────

export interface Clip {
  id: string
  trackId: string
  startTime: number
  duration: number
  videoUrl: string | null
  proxyUrl: string | null
  thumbnailUrl: string | null
  prompt: string
  engineUsed: string
  tier: string
  characterIds: string[]
  locationId: string | null
  isGenerating: boolean
  generationProgress: number
  jobId: string | null
  trimIn: number
  trimOut: number
  volume: number
  opacity: number
  speed: number
  colourGradeJson: object | null
  sfxMakeupJson: object | null
  name?: string
  src?: string
  type?: string
  metadata?: Record<string, unknown>
}

export interface Track {
  id: string
  type: 'video' | 'audio' | 'text' | 'vfx' | 'cgi'
  name: string
  label?: string
  height: number
  muted: boolean
  locked: boolean
  solo: boolean
  volume?: number
  clips: Clip[]
}

export interface TimelineRecipe {
  id: string
  projectId: string
  tracks: Track[]
  totalDuration: number
  durationSeconds?: number
  fps: number
  resolution: { width: number; height: number }
  colourSpace: string
}

export interface RepaintSelection {
  clipId: string
  startSeconds: number
  endSeconds: number
}

// ─── Store interface ───────────────────────────────────────────────────────────

interface EditorState {
  recipe: TimelineRecipe | null
  /** @deprecated use recipe */
  timeline: TimelineRecipe | null
  selectedClipId: string | null
  selectedTrackId: string | null
  playheadTime: number
  isPlaying: boolean
  zoomLevel: number
  /** @deprecated use zoomLevel */
  zoom: number
  scrollOffset: number
  repaintSelection: RepaintSelection | null
  isRepaintModalOpen: boolean
  multiSelectClipIds: string[]

  // Mode/tier (legacy compat)
  mode: 'simple' | 'advanced' | 'ultimate'
  activeTier: 'Draft' | 'Studio' | 'Blockbuster'

  // Core actions
  setRecipe: (recipe: TimelineRecipe) => void
  /** @deprecated use setRecipe */
  setTimeline: (recipe: TimelineRecipe) => void
  selectClip: (clipId: string | null) => void
  selectTrack: (trackId: string | null) => void
  setPlayheadTime: (t: number) => void
  setIsPlaying: (v: boolean) => void
  setZoomLevel: (z: number) => void
  /** @deprecated use setZoomLevel */
  setZoom: (z: number) => void
  setScrollOffset: (o: number) => void
  setMode: (mode: 'simple' | 'advanced' | 'ultimate') => void
  setTier: (tier: 'Draft' | 'Studio' | 'Blockbuster') => void

  // Clip CRUD
  addClip: (trackId: string, clip: Clip) => void
  /** @deprecated use addClip */
  addClipToTrack: (trackId: string, clip: Clip) => void
  updateClip: (clipId: string, updates: Partial<Clip>) => void
  removeClip: (clipId: string) => void
  moveClip: (clipId: string, toTrackId: string, toStartTime: number) => void
  trimClip: (clipId: string, trimIn: number, trimOut: number) => void
  splitClip: (clipId: string, atTime: number) => void

  // Track CRUD
  addTrack: (type: Track['type'] | Track) => void
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<Track>) => void
  reorderTracks: (trackIds: string[]) => void

  // Generating jobs
  addGeneratingJob: (jobId: string, clipId: string, trackId: string, duration?: number) => void
  updateGenerationProgress: (jobId: string, progress: number) => void
  resolveGeneratingJob: (jobId: string, outputUrl: string, proxyUrl?: string, thumbnailUrl?: string) => void
  removeGeneratingJob: (jobId: string) => void

  // Repaint
  setRepaintSelection: (sel: RepaintSelection | null) => void
  openRepaintModal: (sel: RepaintSelection) => void
  closeRepaintModal: () => void
}

// ─── Store implementation ──────────────────────────────────────────────────────

export const useEditorStore = create<EditorState>((set, get) => ({
  recipe: null,
  timeline: null,
  selectedClipId: null,
  selectedTrackId: null,
  playheadTime: 0,
  isPlaying: false,
  zoomLevel: 100,
  zoom: 1,
  scrollOffset: 0,
  repaintSelection: null,
  isRepaintModalOpen: false,
  multiSelectClipIds: [],
  mode: 'simple',
  activeTier: 'Studio',

  setRecipe: (recipe) => set({ recipe, timeline: recipe }),
  setTimeline: (recipe) => set({ recipe, timeline: recipe }),

  selectClip: (clipId) => set({ selectedClipId: clipId }),
  selectTrack: (trackId) => set({ selectedTrackId: trackId }),
  setPlayheadTime: (t) => set({ playheadTime: t }),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setZoomLevel: (z) => set({ zoomLevel: Math.max(20, Math.min(500, z)), zoom: z / 100 }),
  setZoom: (z) => set({ zoom: Math.max(0.1, Math.min(10, z)), zoomLevel: z * 100 }),
  setScrollOffset: (o) => set({ scrollOffset: o }),
  setMode: (mode) => set({ mode }),
  setTier: (activeTier) => set({ activeTier }),

  addClip: (trackId, clip) => set((s) => {
    if (!s.recipe) return {}
    const tracks = s.recipe.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: [...t.clips, clip] } : t
    )
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  addClipToTrack: (trackId, clip) => get().addClip(trackId, clip),

  updateClip: (clipId, updates) => set((s) => {
    if (!s.recipe) return {}
    const tracks = s.recipe.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => c.id === clipId ? { ...c, ...updates } : c),
    }))
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  removeClip: (clipId) => set((s) => {
    if (!s.recipe) return {}
    const tracks = s.recipe.tracks.map((t) => ({
      ...t, clips: t.clips.filter((c) => c.id !== clipId),
    }))
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  moveClip: (clipId, toTrackId, toStartTime) => set((s) => {
    if (!s.recipe) return {}
    let moving: Clip | undefined
    const tracks = s.recipe.tracks.map((t) => {
      const idx = t.clips.findIndex((c) => c.id === clipId)
      if (idx !== -1) { moving = t.clips[idx]; return { ...t, clips: t.clips.filter((c) => c.id !== clipId) } }
      return t
    }).map((t) => {
      if (t.id === toTrackId && moving) {
        return { ...t, clips: [...t.clips, { ...moving, trackId: toTrackId, startTime: toStartTime }] }
      }
      return t
    })
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  trimClip: (clipId, trimIn, trimOut) => get().updateClip(clipId, { trimIn, trimOut }),

  splitClip: (clipId, atTime) => set((s) => {
    if (!s.recipe) return {}
    const tracks = s.recipe.tracks.map((t) => {
      const idx = t.clips.findIndex((c) => c.id === clipId)
      if (idx === -1) return t
      const clip = t.clips[idx]
      const splitPoint = atTime - clip.startTime
      if (splitPoint <= 0 || splitPoint >= clip.duration) return t
      const a: Clip = { ...clip, id: `${clip.id}_a`, duration: splitPoint, trimOut: 0 }
      const b: Clip = { ...clip, id: `${clip.id}_b`, startTime: atTime, duration: clip.duration - splitPoint, trimIn: 0 }
      const clips = [...t.clips]
      clips.splice(idx, 1, a, b)
      return { ...t, clips }
    })
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  addTrack: (typeOrTrack) => set((s) => {
    if (!s.recipe) return {}
    const track: Track = typeof typeOrTrack === 'string'
      ? { id: `track_${nanoid(6)}`, type: typeOrTrack as Track['type'], name: `${typeOrTrack} track`, height: 72, muted: false, locked: false, solo: false, clips: [] }
      : typeOrTrack
    const r = { ...s.recipe, tracks: [...s.recipe.tracks, track] }
    return { recipe: r, timeline: r }
  }),

  removeTrack: (trackId) => set((s) => {
    if (!s.recipe) return {}
    const r = { ...s.recipe, tracks: s.recipe.tracks.filter((t) => t.id !== trackId) }
    return { recipe: r, timeline: r }
  }),

  updateTrack: (trackId, updates) => set((s) => {
    if (!s.recipe) return {}
    const tracks = s.recipe.tracks.map((t) => t.id === trackId ? { ...t, ...updates } : t)
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  reorderTracks: (trackIds) => set((s) => {
    if (!s.recipe) return {}
    const map = new Map(s.recipe.tracks.map((t) => [t.id, t]))
    const tracks = trackIds.map((id) => map.get(id)).filter((t): t is Track => !!t)
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  addGeneratingJob: (jobId, clipId, trackId, duration = 5) => set((s) => {
    if (!s.recipe) return {}
    const track = s.recipe.tracks.find((t) => t.id === trackId)
    const lastEnd = track?.clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0) ?? 0
    const placeholder: Clip = {
      id: clipId, trackId, startTime: lastEnd, duration,
      videoUrl: null, proxyUrl: null, thumbnailUrl: null,
      prompt: '', engineUsed: 'pending', tier: 'standard', characterIds: [],
      locationId: null, isGenerating: true, generationProgress: 0, jobId,
      trimIn: 0, trimOut: 0, volume: 1, opacity: 1, speed: 1,
      colourGradeJson: null, sfxMakeupJson: null,
    }
    const tracks = s.recipe.tracks.map((t) =>
      t.id === trackId ? { ...t, clips: [...t.clips, placeholder] } : t
    )
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  updateGenerationProgress: (jobId, progress) => set((s) => {
    if (!s.recipe) return {}
    const tracks = s.recipe.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => c.jobId === jobId ? { ...c, generationProgress: progress } : c),
    }))
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  resolveGeneratingJob: (jobId, outputUrl, proxyUrl = '', thumbnailUrl = '') => set((s) => {
    if (!s.recipe) return {}
    const tracks = s.recipe.tracks.map((t) => ({
      ...t,
      clips: t.clips.map((c) => c.jobId === jobId
        ? { ...c, videoUrl: outputUrl, proxyUrl, thumbnailUrl, isGenerating: false, generationProgress: 100 }
        : c),
    }))
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  removeGeneratingJob: (jobId) => set((s) => {
    if (!s.recipe) return {}
    const tracks = s.recipe.tracks.map((t) => ({
      ...t, clips: t.clips.filter((c) => c.jobId !== jobId),
    }))
    const r = { ...s.recipe, tracks }
    return { recipe: r, timeline: r }
  }),

  setRepaintSelection: (sel) => set({ repaintSelection: sel }),
  openRepaintModal: (sel) => set({ repaintSelection: sel, isRepaintModalOpen: true }),
  closeRepaintModal: () => set({ isRepaintModalOpen: false, repaintSelection: null }),
}))

// Backward-compat alias
export const useStudioStore = useEditorStore
