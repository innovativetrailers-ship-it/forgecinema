import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { TimelineRecipe } from '@/lib/timeline/schema'

interface PlaybackState {
  recipe:        TimelineRecipe | null
  playheadTime:  number
  projectId:     string | null
  setRecipe:     (recipe: TimelineRecipe) => void
  setPlayhead:   (sec: number) => void
  setProjectId:  (id: string) => void
}

export const usePlaybackStore = create<PlaybackState>()(
  persist(
    (set) => ({
      recipe:       null,
      playheadTime: 0,
      projectId:    null,
      setRecipe:    (recipe) => set({ recipe }),
      setPlayhead:  (playheadTime) => set({ playheadTime }),
      setProjectId: (projectId) => set({ projectId }),
    }),
    {
      name: 'cinema-playback-state',
      partialize: (state) => ({
        recipe:       state.recipe,
        playheadTime: state.playheadTime,
        projectId:    state.projectId,
      }),
    },
  ),
)
