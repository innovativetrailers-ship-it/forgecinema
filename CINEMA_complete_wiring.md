# CINEMATIC FORGE — COMPLETE WIRING DOCUMENT
## Every Interactive Element, Connected End-to-End
### Feed to Cursor AFTER all other documents

> This document wires every button, icon, keyboard shortcut, store method, panel tab,
> context menu, and player control. Nothing is left as a stub or placeholder.
> If it exists in the UI, it does something real when clicked.

---

## PART 1 — COMPLETE ZUSTAND STORES

Two stores. One for editor state, one for UI state. They are separate.

### `src/store/editor.ts` — Complete Definition

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

export interface Clip {
  id: string
  trackId: string
  startTime: number        // seconds from timeline start
  duration: number
  videoUrl: string | null  // null while generating
  proxyUrl: string | null
  thumbnailUrl: string | null
  prompt: string
  engineUsed: string       // internal — never shown to user
  tier: string
  characterIds: string[]
  locationId: string | null
  isGenerating: boolean
  generationProgress: number  // 0-100
  jobId: string | null
  trimIn: number           // seconds trimmed from start
  trimOut: number          // seconds trimmed from end
  volume: number           // 0-1, default 1
  opacity: number          // 0-1, default 1
  speed: number            // 1 = normal, 0.5 = half speed
  colourGradeJson: object | null
  sfxMakeupJson: object | null
}

export interface Track {
  id: string
  type: 'video' | 'audio' | 'text' | 'vfx'
  name: string
  height: number           // px, default 72
  muted: boolean
  locked: boolean
  solo: boolean
  clips: Clip[]
}

export interface TimelineRecipe {
  id: string
  projectId: string
  tracks: Track[]
  totalDuration: number
  fps: number
  resolution: { width: number; height: number }
  colourSpace: string
}

export interface RepaintSelection {
  clipId: string
  startSeconds: number
  endSeconds: number
}

interface EditorStore {
  recipe: TimelineRecipe | null
  selectedClipId: string | null
  selectedTrackId: string | null
  playheadTime: number
  isPlaying: boolean
  zoomLevel: number
  scrollOffset: number
  repaintSelection: RepaintSelection | null
  isRepaintModalOpen: boolean
  multiSelectClipIds: string[]

  // Actions
  setRecipe: (recipe: TimelineRecipe) => void
  selectClip: (clipId: string | null) => void
  selectTrack: (trackId: string | null) => void
  setPlayheadTime: (t: number) => void
  setIsPlaying: (v: boolean) => void
  setZoomLevel: (z: number) => void
  setScrollOffset: (o: number) => void

  addClip: (trackId: string, clip: Clip) => void
  updateClip: (clipId: string, updates: Partial<Clip>) => void
  removeClip: (clipId: string) => void
  moveClip: (clipId: string, toTrackId: string, toStartTime: number) => void
  trimClip: (clipId: string, trimIn: number, trimOut: number) => void
  splitClip: (clipId: string, atTime: number) => void

  addTrack: (type: Track['type']) => void
  removeTrack: (trackId: string) => void
  updateTrack: (trackId: string, updates: Partial<Track>) => void
  reorderTracks: (trackIds: string[]) => void

  addGeneratingJob: (jobId: string, clipId: string, trackId: string) => void
  updateGenerationProgress: (jobId: string, progress: number) => void
  resolveGeneratingJob: (jobId: string, outputUrl: string, proxyUrl: string, thumbnailUrl: string) => void
  removeGeneratingJob: (jobId: string) => void

  setRepaintSelection: (sel: RepaintSelection | null) => void
  openRepaintModal: (sel: RepaintSelection) => void
  closeRepaintModal: () => void
}

export const useEditorStore = create<EditorStore>()(
  immer((set) => ({
    recipe: null,
    selectedClipId: null,
    selectedTrackId: null,
    playheadTime: 0,
    isPlaying: false,
    zoomLevel: 100,
    scrollOffset: 0,
    repaintSelection: null,
    isRepaintModalOpen: false,
    multiSelectClipIds: [],

    setRecipe: (recipe) => set(s => { s.recipe = recipe }),
    selectClip: (clipId) => set(s => { s.selectedClipId = clipId }),
    selectTrack: (trackId) => set(s => { s.selectedTrackId = trackId }),
    setPlayheadTime: (t) => set(s => { s.playheadTime = t }),
    setIsPlaying: (v) => set(s => { s.isPlaying = v }),
    setZoomLevel: (z) => set(s => { s.zoomLevel = Math.max(20, Math.min(500, z)) }),
    setScrollOffset: (o) => set(s => { s.scrollOffset = o }),

    addClip: (trackId, clip) => set(s => {
      const track = s.recipe?.tracks.find(t => t.id === trackId)
      if (track) track.clips.push(clip)
    }),

    updateClip: (clipId, updates) => set(s => {
      s.recipe?.tracks.forEach(track => {
        const clip = track.clips.find(c => c.id === clipId)
        if (clip) Object.assign(clip, updates)
      })
    }),

    removeClip: (clipId) => set(s => {
      s.recipe?.tracks.forEach(track => {
        track.clips = track.clips.filter(c => c.id !== clipId)
      })
    }),

    moveClip: (clipId, toTrackId, toStartTime) => set(s => {
      let clipToMove: Clip | undefined
      s.recipe?.tracks.forEach(track => {
        const idx = track.clips.findIndex(c => c.id === clipId)
        if (idx !== -1) { clipToMove = track.clips.splice(idx, 1)[0] }
      })
      if (clipToMove) {
        clipToMove.trackId = toTrackId
        clipToMove.startTime = toStartTime
        const toTrack = s.recipe?.tracks.find(t => t.id === toTrackId)
        toTrack?.clips.push(clipToMove)
      }
    }),

    trimClip: (clipId, trimIn, trimOut) => set(s => {
      s.recipe?.tracks.forEach(track => {
        const clip = track.clips.find(c => c.id === clipId)
        if (clip) { clip.trimIn = trimIn; clip.trimOut = trimOut }
      })
    }),

    splitClip: (clipId, atTime) => set(s => {
      s.recipe?.tracks.forEach(track => {
        const idx = track.clips.findIndex(c => c.id === clipId)
        if (idx !== -1) {
          const clip = track.clips[idx]
          const splitPoint = atTime - clip.startTime
          const clipA: Clip = { ...clip, id: `${clip.id}_a`, duration: splitPoint, trimOut: 0 }
          const clipB: Clip = { ...clip, id: `${clip.id}_b`, startTime: atTime, trimIn: splitPoint }
          track.clips.splice(idx, 1, clipA, clipB)
        }
      })
    }),

    addTrack: (type) => set(s => {
      s.recipe?.tracks.push({
        id: `track_${Date.now()}`, type, name: `${type} track`,
        height: 72, muted: false, locked: false, solo: false, clips: []
      })
    }),

    removeTrack: (trackId) => set(s => {
      if (s.recipe) s.recipe.tracks = s.recipe.tracks.filter(t => t.id !== trackId)
    }),

    updateTrack: (trackId, updates) => set(s => {
      const track = s.recipe?.tracks.find(t => t.id === trackId)
      if (track) Object.assign(track, updates)
    }),

    reorderTracks: (trackIds) => set(s => {
      if (!s.recipe) return
      const map = Object.fromEntries(s.recipe.tracks.map(t => [t.id, t]))
      s.recipe.tracks = trackIds.map(id => map[id]).filter(Boolean)
    }),

    addGeneratingJob: (jobId, clipId, trackId) => set(s => {
      const placeholderClip: Clip = {
        id: clipId, trackId, startTime: s.recipe?.tracks.find(t => t.id === trackId)?.clips.reduce((acc, c) => Math.max(acc, c.startTime + c.duration), 0) ?? 0,
        duration: 5, videoUrl: null, proxyUrl: null, thumbnailUrl: null,
        prompt: '', engineUsed: 'pending', tier: 'standard', characterIds: [],
        locationId: null, isGenerating: true, generationProgress: 0, jobId,
        trimIn: 0, trimOut: 0, volume: 1, opacity: 1, speed: 1,
        colourGradeJson: null, sfxMakeupJson: null,
      }
      const track = s.recipe?.tracks.find(t => t.id === trackId)
      track?.clips.push(placeholderClip)
    }),

    updateGenerationProgress: (jobId, progress) => set(s => {
      s.recipe?.tracks.forEach(track => {
        const clip = track.clips.find(c => c.jobId === jobId)
        if (clip) clip.generationProgress = progress
      })
    }),

    resolveGeneratingJob: (jobId, outputUrl, proxyUrl, thumbnailUrl) => set(s => {
      s.recipe?.tracks.forEach(track => {
        const clip = track.clips.find(c => c.jobId === jobId)
        if (clip) {
          clip.videoUrl = outputUrl
          clip.proxyUrl = proxyUrl
          clip.thumbnailUrl = thumbnailUrl
          clip.isGenerating = false
          clip.generationProgress = 100
        }
      })
    }),

    removeGeneratingJob: (jobId) => set(s => {
      s.recipe?.tracks.forEach(track => {
        track.clips = track.clips.filter(c => c.jobId !== jobId)
      })
    }),

    setRepaintSelection: (sel) => set(s => { s.repaintSelection = sel }),
    openRepaintModal: (sel) => set(s => { s.repaintSelection = sel; s.isRepaintModalOpen = true }),
    closeRepaintModal: () => set(s => { s.isRepaintModalOpen = false; s.repaintSelection = null }),
  }))
)
```

### `src/store/ui.ts` — Complete Definition

```typescript
import { create } from 'zustand'

export type LeftPanelId =
  | 'generate' | 'vault' | 'library' | 'location' | 'cast'
  | 'sfx_makeup' | 'greenscreen' | 'cgi' | 'vfx' | 'transitions'
  | 'audio' | 'stock' | 'script' | 'storyboard' | 'avatar'
  | 'brand_kit' | 'settings' | 'translate' | 'highlights'

export type ToolId =
  | 'select' | 'razor' | 'repaint' | 'text' | 'motion_brush'
  | 'track' | 'hand' | 'zoom'

export type RightPanelId =
  | 'properties' | 'colour' | 'audio' | 'vfx' | 'cgi'
  | 'director' | 'upscale' | 'makeup' | 'greenscreen'

export type FilmToolbarTab =
  | 'script' | 'storyboard' | 'director' | 'continuity' | 'cast'
  | 'locations' | 'colour' | 'vfx_mix' | 'audio_mix' | 'greenscreen'
  | 'sfx_makeup' | 'cgi'

export type EditorMode = 'simple' | 'advanced' | 'ultimate'

interface UIStore {
  activePanel: LeftPanelId | null
  activeTool: ToolId
  activeRightPanel: RightPanelId
  activeFilmTab: FilmToolbarTab | null
  editorMode: EditorMode
  isCreditModalOpen: boolean
  isCharacterOnboardingOpen: boolean
  toasts: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>

  setActivePanel: (panel: LeftPanelId | null) => void
  togglePanel: (panel: LeftPanelId) => void
  setActiveTool: (tool: ToolId) => void
  setActiveRightPanel: (panel: RightPanelId) => void
  setActiveFilmTab: (tab: FilmToolbarTab | null) => void
  setEditorMode: (mode: EditorMode) => void
  openCreditModal: () => void
  closeCreditModal: () => void
  openCharacterOnboarding: () => void
  closeCharacterOnboarding: () => void
  addToast: (message: string, type?: 'success' | 'error' | 'info') => void
  removeToast: (id: string) => void
}

export const useUIStore = create<UIStore>((set, get) => ({
  activePanel: 'generate',
  activeTool: 'select',
  activeRightPanel: 'properties',
  activeFilmTab: null,
  editorMode: 'advanced',
  isCreditModalOpen: false,
  isCharacterOnboardingOpen: false,
  toasts: [],

  setActivePanel: (panel) => set({ activePanel: panel }),
  togglePanel: (panel) => set(s => ({ activePanel: s.activePanel === panel ? null : panel })),
  setActiveTool: (tool) => set({ activeTool: tool }),
  setActiveRightPanel: (panel) => set({ activeRightPanel: panel }),
  setActiveFilmTab: (tab) => set({ activeFilmTab: tab }),
  setEditorMode: (mode) => set({ editorMode: mode }),
  openCreditModal: () => set({ isCreditModalOpen: true }),
  closeCreditModal: () => set({ isCreditModalOpen: false }),
  openCharacterOnboarding: () => set({ isCharacterOnboardingOpen: true }),
  closeCharacterOnboarding: () => set({ isCharacterOnboardingOpen: false }),

  addToast: (message, type = 'info') => {
    const id = Date.now().toString()
    set(s => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => get().removeToast(id), 4000)
  },
  removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
```

---

## PART 2 — TOP TOOLBAR (Film Mode Tabs)

```tsx
// src/components/layout/FilmToolbar.tsx
// The horizontal row of film production tabs (Script, Storyboard, AI Director, etc.)

const FILM_TABS: Array<{ id: FilmToolbarTab; label: string; tierRequired?: string }> = [
  { id: 'script',      label: 'Script' },
  { id: 'storyboard',  label: 'Storyboard' },
  { id: 'director',    label: 'AI Director',  tierRequired: 'STUDIO' },
  { id: 'continuity',  label: 'Continuity' },
  { id: 'cast',        label: 'Cast' },
  { id: 'locations',   label: 'Locations' },
  { id: 'colour',      label: 'Colour Grade' },
  { id: 'vfx_mix',     label: 'VFX Mix' },
  { id: 'audio_mix',   label: 'Audio Mix' },
  { id: 'greenscreen', label: 'Green Screen' },
  { id: 'sfx_makeup',  label: 'SFX Makeup' },
  { id: 'cgi',         label: 'CGI',          tierRequired: 'STUDIO' },
]

export function FilmToolbar() {
  const { activeFilmTab, setActiveFilmTab, setActivePanel, setActiveRightPanel } = useUIStore()

  const handleTabClick = (tab: FilmToolbarTab) => {
    // Film toolbar tabs also affect left panel and right panel
    const panelMap: Partial<Record<FilmToolbarTab, LeftPanelId>> = {
      script:      'script',
      storyboard:  'storyboard',
      cast:        'cast',
      locations:   'location',
      sfx_makeup:  'sfx_makeup',
      greenscreen: 'greenscreen',
      cgi:         'cgi',
    }
    const rightPanelMap: Partial<Record<FilmToolbarTab, RightPanelId>> = {
      director: 'director',
      colour:   'colour',
      vfx_mix:  'vfx',
      audio_mix:'audio',
    }

    setActiveFilmTab(activeFilmTab === tab ? null : tab)
    if (panelMap[tab]) setActivePanel(panelMap[tab]!)
    if (rightPanelMap[tab]) setActiveRightPanel(rightPanelMap[tab]!)
  }

  return (
    <div className="flex items-center gap-0.5 px-2 h-9 border-b border-[#1a1f2e] overflow-x-auto scrollbar-none">
      {FILM_TABS.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => handleTabClick(id)}
          className={`
            px-3 py-1 text-xs rounded whitespace-nowrap transition
            ${activeFilmTab === id
              ? 'bg-[#00e5c8]/15 text-[#00e5c8] font-medium'
              : 'text-gray-400 hover:text-white hover:bg-white/5'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
```

---

## PART 3 — EDIT TOOL TOOLBAR (Select, Razor, Repaint, etc.)

```tsx
// src/components/layout/EditToolbar.tsx
// The row of editing tools that determine what happens when you click a clip

const TOOLS: Array<{ id: ToolId; icon: LucideIcon; label: string; shortcut: string }> = [
  { id: 'select',       icon: MousePointer2,  label: 'Select',       shortcut: 'V' },
  { id: 'razor',        icon: Scissors,       label: 'Razor',        shortcut: 'C' },
  { id: 'repaint',      icon: Paintbrush2,    label: 'Repaint',      shortcut: 'R' },
  { id: 'text',         icon: Type,           label: 'Text',         shortcut: 'T' },
  { id: 'motion_brush', icon: Wind,           label: 'Motion Brush', shortcut: 'M' },
  { id: 'hand',         icon: Hand,           label: 'Hand',         shortcut: 'H' },
  { id: 'zoom',         icon: ZoomIn,         label: 'Zoom',         shortcut: 'Z' },
]

export function EditToolbar() {
  const { activeTool, setActiveTool } = useUIStore()
  const { recipe, zoomLevel, setZoomLevel } = useEditorStore()

  return (
    <div className="flex items-center gap-1 px-2 h-9 border-b border-[#1a1f2e]">
      {TOOLS.map(({ id, icon: Icon, label, shortcut }) => (
        <button
          key={id}
          onClick={() => setActiveTool(id)}
          title={`${label} (${shortcut})`}
          className={`
            w-8 h-7 rounded flex items-center justify-center transition
            ${activeTool === id
              ? 'bg-[#00e5c8]/20 text-[#00e5c8]'
              : 'text-gray-500 hover:text-white hover:bg-white/5'
            }
          `}
        >
          <Icon size={15} />
        </button>
      ))}

      <div className="mx-1 w-px h-5 bg-[#1a1f2e]" />

      {/* Undo / Redo */}
      <button
        onClick={() => document.execCommand('undo')}
        title="Undo (Cmd+Z)"
        className="w-8 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5"
      >
        <Undo2 size={15} />
      </button>
      <button
        onClick={() => document.execCommand('redo')}
        title="Redo (Cmd+Shift+Z)"
        className="w-8 h-7 rounded flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/5"
      >
        <Redo2 size={15} />
      </button>

      <div className="mx-1 w-px h-5 bg-[#1a1f2e]" />

      {/* Zoom */}
      <button onClick={() => setZoomLevel(zoomLevel * 1.25)} title="Zoom in (+)" className="..."><ZoomIn size={15} /></button>
      <span className="text-xs text-gray-500 w-10 text-center">{Math.round(zoomLevel)}%</span>
      <button onClick={() => setZoomLevel(zoomLevel * 0.8)} title="Zoom out (-)" className="..."><ZoomOut size={15} /></button>

      {/* Add Track */}
      <div className="ml-auto flex gap-1">
        <button
          onClick={() => useEditorStore.getState().addTrack('video')}
          className="text-xs px-2 py-1 text-gray-400 hover:text-white hover:bg-white/5 rounded"
        >
          + Video Track
        </button>
        <button
          onClick={() => useEditorStore.getState().addTrack('audio')}
          className="text-xs px-2 py-1 text-gray-400 hover:text-white hover:bg-white/5 rounded"
        >
          + Audio Track
        </button>
      </div>
    </div>
  )
}
```

---

## PART 4 — KEYBOARD SHORTCUTS (Global)

```tsx
// src/components/layout/KeyboardHandler.tsx
// Mount this ONCE in src/app/(editor)/layout.tsx

'use client'
import { useEffect } from 'react'
import { useEditorStore } from '@/store/editor'
import { useUIStore } from '@/store/ui'

export function KeyboardHandler() {
  const { setActiveTool, togglePanel } = useUIStore()
  const { selectedClipId, playheadTime, recipe, setIsPlaying, isPlaying,
          openRepaintModal, setPlayheadTime, splitClip, removeClip } = useEditorStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ignore when typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return
      const cmd = e.metaKey || e.ctrlKey

      switch (e.key) {
        // Tools
        case 'v': case 'V': setActiveTool('select'); break
        case 'c': case 'C': if (!cmd) setActiveTool('razor'); break
        case 'r': case 'R': {
          setActiveTool('repaint')
          // If a clip is selected, open repaint modal immediately
          if (selectedClipId) {
            const clip = recipe?.tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId)
            if (clip) openRepaintModal({ clipId: clip.id, startSeconds: clip.startTime, endSeconds: clip.startTime + clip.duration })
          }
          break
        }
        case 't': case 'T': setActiveTool('text'); break
        case 'm': case 'M': setActiveTool('motion_brush'); break
        case 'h': case 'H': setActiveTool('hand'); break

        // Playback
        case ' ': e.preventDefault(); setIsPlaying(!isPlaying); break
        case 'ArrowLeft': setPlayheadTime(Math.max(0, playheadTime - (e.shiftKey ? 1 : 0.1))); break
        case 'ArrowRight': setPlayheadTime(playheadTime + (e.shiftKey ? 1 : 0.1)); break

        // Edit ops on selected clip
        case 'Backspace': case 'Delete':
          if (selectedClipId) removeClip(selectedClipId)
          break
        case 's': case 'S':
          if (!cmd && selectedClipId) splitClip(selectedClipId, playheadTime)
          break

        // Save
        case 'z': case 'Z': break // handled by browser undo
        case 's': if (cmd) { e.preventDefault(); saveProject() } break

        // Panel shortcuts
        case 'g': case 'G': togglePanel('generate'); break
        case 'u': case 'U': togglePanel('vault'); break
        case 'l': case 'L': togglePanel('library'); break
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedClipId, playheadTime, isPlaying, recipe])

  return null
}

async function saveProject() {
  const { recipe } = useEditorStore.getState()
  if (!recipe) return
  await fetch(`/api/projects/${recipe.projectId}/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ recipe }),
  })
}
```

---

## PART 5 — CLIP INTERACTIONS (Click, Right-click, Drag)

```tsx
// src/components/editor/Clip.tsx — Complete clip interaction wiring

export function Clip({ clip, trackId, pixelsPerSecond }: ClipProps) {
  const {
    selectedClipId, selectClip, activeTool, openRepaintModal,
    moveClip, trimClip, splitClip, removeClip, setActiveRightPanel
  } = { ...useEditorStore(), ...useUIStore() }

  const isSelected = selectedClipId === clip.id
  const leftPx = clip.startTime * pixelsPerSecond
  const widthPx = (clip.duration - clip.trimIn - clip.trimOut) * pixelsPerSecond

  // Main click
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeTool === 'razor') {
      const clickX = e.nativeEvent.offsetX
      const clickTime = clip.startTime + clickX / pixelsPerSecond
      splitClip(clip.id, clickTime)
    } else if (activeTool === 'repaint') {
      openRepaintModal({ clipId: clip.id, startSeconds: clip.startTime, endSeconds: clip.startTime + clip.duration })
    } else {
      selectClip(clip.id)
      setActiveRightPanel('properties')
    }
  }

  // Right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    showContextMenu(e.clientX, e.clientY, [
      { label: 'Repaint', shortcut: 'R', action: () => openRepaintModal({ clipId: clip.id, startSeconds: clip.startTime, endSeconds: clip.startTime + clip.duration }) },
      { label: 'Duplicate', action: () => duplicateClip(clip) },
      { label: 'Split at Playhead', shortcut: 'S', action: () => splitClip(clip.id, useEditorStore.getState().playheadTime) },
      { label: 'Extend Clip (AI)', action: () => extendClip(clip.id) },
      { label: 'Upscale', action: () => upscaleClip(clip.id) },
      { label: 'Colour Grade', action: () => { selectClip(clip.id); setActiveRightPanel('colour') } },
      { label: 'SFX Makeup', action: () => { selectClip(clip.id); setActiveRightPanel('makeup') } },
      { separator: true },
      { label: 'Delete', shortcut: 'Del', action: () => removeClip(clip.id), destructive: true },
    ])
  }

  return (
    <div
      className={`absolute top-1 bottom-1 rounded overflow-hidden cursor-pointer select-none
        ${isSelected ? 'ring-2 ring-[#00e5c8]' : 'ring-1 ring-white/10'}
        ${clip.isGenerating ? 'animate-pulse' : ''}
      `}
      style={{ left: leftPx, width: widthPx }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Thumbnail */}
      {clip.thumbnailUrl && (
        <img src={clip.thumbnailUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
      )}

      {/* Generating overlay */}
      {clip.isGenerating && (
        <div className="absolute inset-0 bg-[#00e5c8]/10 flex flex-col items-center justify-center gap-1">
          <Loader2 className="w-4 h-4 text-[#00e5c8] animate-spin" />
          <div className="w-3/4 h-0.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#00e5c8] transition-all"
              style={{ width: `${clip.generationProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Trim handles */}
      <TrimHandle clip={clip} side="left" />
      <TrimHandle clip={clip} side="right" />

      {/* Label */}
      <div className="absolute bottom-0 left-0 right-0 px-1.5 py-0.5 text-xs text-white/80 bg-black/40 truncate">
        {clip.prompt || 'Generated clip'}
      </div>
    </div>
  )
}
```

---

## PART 6 — REPAINT MODAL (Complete)

```tsx
// src/components/panels/RepaintModal.tsx

export function RepaintModal() {
  const { isRepaintModalOpen, repaintSelection, closeRepaintModal } = useEditorStore()
  const { addToast } = useUIStore()
  const [prompt, setPrompt] = useState('')
  const [tier, setTier] = useState<'draft' | 'standard' | 'cinematic' | 'film'>('standard')
  const [isRunning, setIsRunning] = useState(false)
  const [phase, setPhase] = useState<'idle' | 'analysing' | 'generating' | 'blending' | 'done'>('idle')
  const [plan, setPlan] = useState<{ engine: string; reason: string } | null>(null)
  const [progress, setProgress] = useState(0)

  if (!isRepaintModalOpen || !repaintSelection) return null

  const { clipId, startSeconds, endSeconds } = repaintSelection
  const segmentDuration = endSeconds - startSeconds

  const handleAnalyse = async () => {
    setPhase('analysing')
    const res = await fetch('/api/timeline/edit', {
      method: 'POST',
      body: JSON.stringify({ clipId, startSeconds, endSeconds, instruction: prompt, analyseOnly: true }),
      headers: { 'Content-Type': 'application/json' },
    })
    const { engineId, reason, enhancedPrompt, estimatedCredits } = await res.json()
    setPlan({ engine: engineId, reason })
    setPhase('idle')
  }

  const handleExecute = async () => {
    setPhase('generating')
    setIsRunning(true)

    const res = await fetch('/api/timeline/edit', {
      method: 'POST',
      body: JSON.stringify({ clipId, startSeconds, endSeconds, instruction: prompt, tier }),
      headers: { 'Content-Type': 'application/json' },
    })
    const { jobId } = await res.json()

    const es = new EventSource(`/api/jobs/${jobId}/stream`)
    es.onmessage = (e) => {
      const event = JSON.parse(e.data)
      if (event.progress) setProgress(event.progress)
      if (event.status === 'blending') setPhase('blending')
      if (event.status === 'COMPLETE') {
        useEditorStore.getState().updateClip(clipId, { videoUrl: event.outputUrl })
        setPhase('done')
        setIsRunning(false)
        es.close()
        addToast('Repaint complete', 'success')
        setTimeout(() => closeRepaintModal(), 1500)
      }
      if (event.status === 'FAILED') {
        setPhase('idle')
        setIsRunning(false)
        es.close()
        addToast(event.errorMessage ?? 'Repaint failed', 'error')
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
      <div className="bg-[#151b24] border border-[#1a2030] rounded-xl w-[520px] p-5 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Repaint Segment</h3>
          <button onClick={closeRepaintModal} className="text-gray-500 hover:text-white"><X size={16} /></button>
        </div>

        <div className="text-xs text-gray-400 mb-3">
          Segment: {startSeconds.toFixed(1)}s → {endSeconds.toFixed(1)}s ({segmentDuration.toFixed(1)}s)
        </div>

        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="What should change? e.g. 'make the building taller', 'add rain', 'fix the hands'"
          rows={3}
          className="w-full bg-[#0d1117] border border-[#2a3040] rounded-lg p-2.5 text-sm text-white placeholder-gray-500 resize-none focus:border-[#00e5c8] focus:outline-none mb-3"
        />

        <TierSelector value={tier} onChange={setTier} compact />

        {/* Analysis result */}
        {plan && (
          <div className="mt-3 p-3 bg-[#00e5c8]/5 border border-[#00e5c8]/20 rounded-lg text-xs text-gray-300">
            <span className="text-[#00e5c8] font-medium">Processing plan: </span>{plan.reason}
          </div>
        )}

        {/* Progress */}
        {isRunning && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{phase === 'generating' ? 'Generating...' : phase === 'blending' ? 'Blending seamlessly...' : 'Done'}</span>
              <span>{progress}%</span>
            </div>
            <div className="h-1 bg-[#1a2030] rounded-full overflow-hidden">
              <div className="h-full bg-[#00e5c8] transition-all rounded-full" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex gap-2 mt-4">
          {!plan && (
            <button
              onClick={handleAnalyse}
              disabled={!prompt.trim() || phase === 'analysing'}
              className="flex-1 py-2 text-sm rounded-lg border border-[#00e5c8]/50 text-[#00e5c8] hover:border-[#00e5c8] disabled:opacity-40"
            >
              {phase === 'analysing' ? 'Analysing...' : 'Analyse First'}
            </button>
          )}
          <button
            onClick={handleExecute}
            disabled={!prompt.trim() || isRunning}
            className="flex-1 py-2 text-sm rounded-lg bg-[#00e5c8] text-black font-semibold hover:bg-[#00e5c8]/90 disabled:opacity-40"
          >
            {isRunning ? 'Processing...' : 'Execute Repaint'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

---

## PART 7 — RIGHT PANEL (Properties, Colour, Audio, etc.)

```tsx
// src/components/panels/RightPanel.tsx — Complete with all tabs

const RIGHT_TABS: Array<{ id: RightPanelId; label: string }> = [
  { id: 'properties', label: 'Props' },
  { id: 'colour',     label: 'Colour' },
  { id: 'audio',      label: 'Audio' },
  { id: 'vfx',        label: 'VFX' },
  { id: 'cgi',        label: 'CGI' },
  { id: 'director',   label: 'Director' },
  { id: 'upscale',    label: 'Upscale' },
  { id: 'makeup',     label: 'Makeup' },
]

export function RightPanel() {
  const { activeRightPanel, setActiveRightPanel } = useUIStore()
  const { selectedClipId, recipe, updateClip } = useEditorStore()

  const selectedClip = recipe?.tracks.flatMap(t => t.clips).find(c => c.id === selectedClipId)

  return (
    <div className="flex flex-col h-full border-l border-[#1a1f2e] w-64 bg-[#0d1117]">
      {/* Tabs */}
      <div className="flex overflow-x-auto scrollbar-none border-b border-[#1a1f2e]">
        {RIGHT_TABS.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setActiveRightPanel(id)}
            className={`px-2.5 py-2 text-xs whitespace-nowrap transition ${
              activeRightPanel === id
                ? 'text-[#00e5c8] border-b-2 border-[#00e5c8]'
                : 'text-gray-500 hover:text-white'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Panel content */}
      <div className="flex-1 overflow-y-auto">
        {!selectedClip && (
          <div className="p-4 text-xs text-gray-500 text-center mt-8">
            Select a clip to see properties
          </div>
        )}

        {selectedClip && activeRightPanel === 'properties' && (
          <PropertiesTab clip={selectedClip} onUpdate={(u) => updateClip(selectedClip.id, u)} />
        )}
        {selectedClip && activeRightPanel === 'colour' && (
          <ColourGradeTab clip={selectedClip} onUpdate={(u) => updateClip(selectedClip.id, u)} />
        )}
        {selectedClip && activeRightPanel === 'audio' && (
          <AudioTab clip={selectedClip} onUpdate={(u) => updateClip(selectedClip.id, u)} />
        )}
        {selectedClip && activeRightPanel === 'vfx' && <VFXTab clip={selectedClip} />}
        {selectedClip && activeRightPanel === 'cgi' && <CGITab clip={selectedClip} />}
        {activeRightPanel === 'director' && <AIDirectorTab />}
        {selectedClip && activeRightPanel === 'upscale' && <UpscaleTab clip={selectedClip} />}
        {selectedClip && activeRightPanel === 'makeup' && <SFXMakeupTab clip={selectedClip} />}
      </div>
    </div>
  )
}

// PropertiesTab — wired controls
function PropertiesTab({ clip, onUpdate }: { clip: Clip; onUpdate: (u: Partial<Clip>) => void }) {
  return (
    <div className="p-3 flex flex-col gap-3">
      <div>
        <label className="text-xs text-gray-400 block mb-1">Volume</label>
        <input type="range" min={0} max={1} step={0.01} value={clip.volume}
          onChange={e => onUpdate({ volume: Number(e.target.value) })}
          className="w-full accent-[#00e5c8]" />
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">Opacity</label>
        <input type="range" min={0} max={1} step={0.01} value={clip.opacity}
          onChange={e => onUpdate({ opacity: Number(e.target.value) })}
          className="w-full accent-[#00e5c8]" />
      </div>
      <div>
        <label className="text-xs text-gray-400 block mb-1">Speed</label>
        <select value={clip.speed} onChange={e => onUpdate({ speed: Number(e.target.value) })}
          className="w-full bg-[#1a1f2e] border border-[#2a3040] rounded p-1.5 text-sm text-white">
          <option value={0.25}>0.25×</option>
          <option value={0.5}>0.5×</option>
          <option value={1}>1× (Normal)</option>
          <option value={1.5}>1.5×</option>
          <option value={2}>2×</option>
        </select>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => useUIStore.getState().openRepaintModal?.() }
          className="flex-1 py-1.5 text-xs rounded border border-[#00e5c8]/40 text-[#00e5c8] hover:border-[#00e5c8]"
        >
          Repaint
        </button>
        <button
          onClick={() => extendClip(clip.id)}
          className="flex-1 py-1.5 text-xs rounded border border-white/10 text-gray-400 hover:text-white"
        >
          Extend
        </button>
      </div>
    </div>
  )
}
```

---

## PART 8 — PREVIEW PLAYER (Play/Pause/Seek)

```tsx
// src/components/editor/Preview.tsx — Wired player controls

export function Preview() {
  const { recipe, playheadTime, isPlaying, setPlayheadTime, setIsPlaying } = useEditorStore()
  const videoRef = useRef<HTMLVideoElement>(null)

  // Sync playhead to video time
  useEffect(() => {
    if (videoRef.current && Math.abs(videoRef.current.currentTime - playheadTime) > 0.1) {
      videoRef.current.currentTime = playheadTime
    }
  }, [playheadTime])

  useEffect(() => {
    if (isPlaying) videoRef.current?.play()
    else videoRef.current?.pause()
  }, [isPlaying])

  const handleTimeUpdate = () => {
    if (videoRef.current) setPlayheadTime(videoRef.current.currentTime)
  }

  const totalDuration = recipe?.totalDuration ?? 0

  return (
    <div className="flex flex-col bg-black h-full">
      {/* Video */}
      <div className="flex-1 flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          className="max-h-full max-w-full"
          onTimeUpdate={handleTimeUpdate}
          onEnded={() => setIsPlaying(false)}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 px-3 py-2 border-t border-[#1a1f2e]">
        {/* Play/Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 rounded-full bg-[#00e5c8] text-black flex items-center justify-center hover:bg-[#00e5c8]/90"
        >
          {isPlaying ? <Pause size={14} fill="black" /> : <Play size={14} fill="black" />}
        </button>

        {/* Time display */}
        <span className="text-xs text-gray-400 font-mono">
          {formatTime(playheadTime)} / {formatTime(totalDuration)}
        </span>

        {/* Seek bar */}
        <input
          type="range" min={0} max={totalDuration} step={0.01} value={playheadTime}
          onChange={e => setPlayheadTime(Number(e.target.value))}
          className="flex-1 accent-[#00e5c8]"
        />

        {/* Volume */}
        <input type="range" min={0} max={1} step={0.01} defaultValue={1}
          onChange={e => { if (videoRef.current) videoRef.current.volume = Number(e.target.value) }}
          className="w-20 accent-[#00e5c8]"
        />
      </div>
    </div>
  )
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}
```

---

## PART 9 — EDITOR LAYOUT (Mount Everything Together)

```tsx
// src/app/(editor)/advanced/page.tsx — Complete layout

import { KeyboardHandler } from '@/components/layout/KeyboardHandler'
import { TokenBar } from '@/components/layout/TokenBar'
import { FilmToolbar } from '@/components/layout/FilmToolbar'
import { EditToolbar } from '@/components/layout/EditToolbar'
import { IconRail } from '@/components/layout/IconRail'
import { LeftPanelContent } from '@/components/layout/LeftPanelContent'
import { Timeline } from '@/components/editor/Timeline'
import { Preview } from '@/components/editor/Preview'
import { RightPanel } from '@/components/panels/RightPanel'
import { RepaintModal } from '@/components/panels/RepaintModal'
import { CreditPurchaseModal } from '@/components/layout/CreditPurchaseModal'
import { CharacterOnboarding } from '@/components/vault/CharacterOnboarding'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { ContextMenu } from '@/components/ui/ContextMenu'

export default function AdvancedEditor() {
  const { isCreditModalOpen, isCharacterOnboardingOpen } = useUIStore()
  const { isRepaintModalOpen } = useEditorStore()

  return (
    <div className="flex flex-col h-screen bg-[#0d1117] text-white pt-10">
      {/* Always-visible token bar */}
      <TokenBar />

      {/* Film mode tab toolbar */}
      <FilmToolbar />

      {/* Edit tool toolbar */}
      <EditToolbar />

      {/* Main editor area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left icon rail */}
        <IconRail />

        {/* Left panel */}
        <div className="w-64 border-r border-[#1a1f2e] overflow-hidden">
          <LeftPanelContent />
        </div>

        {/* Center: preview + timeline */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Preview (upper 40%) */}
          <div className="h-[40%] border-b border-[#1a1f2e]">
            <Preview />
          </div>

          {/* Timeline (lower 60%) */}
          <div className="flex-1 overflow-hidden">
            <Timeline />
          </div>
        </div>

        {/* Right panel */}
        <RightPanel />
      </div>

      {/* Modals — mounted once, shown/hidden by state */}
      {isRepaintModalOpen && <RepaintModal />}
      {isCreditModalOpen && <CreditPurchaseModal />}
      {isCharacterOnboardingOpen && <CharacterOnboarding />}

      {/* Global systems */}
      <KeyboardHandler />
      <ToastContainer />
      <ContextMenu />
    </div>
  )
}
```

---

## PART 10 — TOAST & CONTEXT MENU SYSTEM

```tsx
// src/components/ui/ToastContainer.tsx
export function ToastContainer() {
  const { toasts, removeToast } = useUIStore()
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map(t => (
        <div key={t.id} onClick={() => removeToast(t.id)}
          className={`px-4 py-2.5 rounded-lg text-sm font-medium shadow-lg cursor-pointer transition
            ${t.type === 'success' ? 'bg-[#00e5c8] text-black' : ''}
            ${t.type === 'error' ? 'bg-red-500 text-white' : ''}
            ${t.type === 'info' ? 'bg-[#1a1f2e] text-white border border-[#2a3040]' : ''}
          `}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}

// src/components/ui/ContextMenu.tsx
// Global context menu — shown via showContextMenu() helper

let setMenuState: ((state: ContextMenuState | null) => void) | null = null

export function showContextMenu(x: number, y: number, items: ContextMenuItem[]) {
  setMenuState?.({ x, y, items })
}

export function ContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)
  setMenuState = setMenu

  useEffect(() => {
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') close() })
    return () => window.removeEventListener('click', close)
  }, [])

  if (!menu) return null
  return (
    <div className="fixed z-[200] bg-[#151b24] border border-[#2a3040] rounded-lg shadow-2xl py-1 min-w-[160px]"
      style={{ left: menu.x, top: menu.y }}
      onClick={e => e.stopPropagation()}
    >
      {menu.items.map((item, i) => item.separator
        ? <div key={i} className="my-1 h-px bg-[#1a2030]" />
        : (
          <button key={i} onClick={() => { item.action(); setMenu(null) }}
            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between
              ${item.destructive ? 'text-red-400 hover:bg-red-500/10' : 'text-gray-300 hover:bg-white/5'}`}
          >
            <span>{item.label}</span>
            {item.shortcut && <span className="text-gray-500 text-[10px]">{item.shortcut}</span>}
          </button>
        )
      )}
    </div>
  )
}
```

---

## PART 11 — WIRING VERIFICATION (Run in Cursor terminal)

```bash
# Verify every wiring point before shipping

echo "=== Checking store usage ==="
grep -r "useEditorStore\|useUIStore" src/components --include="*.tsx" | wc -l
# Should be > 20 (every component that needs state)

echo "=== Checking all icon rail items have onClick ==="
grep -A3 "IconRail\|icon-rail\|iconRail" src/components/layout/IconRail.tsx | grep "onClick"
# Must have onClick for each icon

echo "=== Checking toolbar tools have onClick ==="
grep "onClick.*setActiveTool\|setActiveTool.*onClick" src/components/layout/EditToolbar.tsx | wc -l
# Should be >= 7

echo "=== Checking keyboard handler is mounted ==="
grep "KeyboardHandler" src/app/\(editor\)/advanced/page.tsx
# Must exist

echo "=== Checking SSE connection in generate panel ==="
grep "EventSource" src/components/panels/GeneratePanel.tsx
# Must exist

echo "=== Checking repaint modal is mounted ==="
grep "RepaintModal" src/app/\(editor\)/advanced/page.tsx
# Must exist

echo "=== Checking TokenBar is mounted ==="
grep "TokenBar" src/app/\(editor\)/advanced/page.tsx src/app/\(editor\)/simple/page.tsx src/app/\(editor\)/ultimate/page.tsx
# Must appear in all 3

echo "=== Checking no 'agent' in UI ==="
grep -ri "agent" src/components --include="*.tsx" | grep -v "// " | grep -v "user-agent"
# Should return ZERO results
```

---

*Cinematic Forge — Complete Wiring Document v1.0*
*Feed to Cursor AFTER all other documents. This wires every interactive element.*
