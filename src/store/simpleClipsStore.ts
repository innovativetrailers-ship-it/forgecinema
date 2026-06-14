import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { GeneratedClip } from '@/components/simple/types'

interface SimpleClipsState {
  clips:    GeneratedClip[]
  setClips: (clips: GeneratedClip[]) => void
  upsertClip: (clip: GeneratedClip) => void
  removeClip: (id: string) => void
  removeFailedClips: () => void
}

function reviveClip(raw: GeneratedClip): GeneratedClip {
  return {
    ...raw,
    createdAt: raw.createdAt instanceof Date ? raw.createdAt : new Date(raw.createdAt),
  }
}

export const useSimpleClipsStore = create<SimpleClipsState>()(
  persist(
    (set) => ({
      clips: [],
      setClips: (clips) => set({ clips }),
      upsertClip: (clip) =>
        set((s) => {
          const idx = s.clips.findIndex(
            (c) => c.id === clip.id || (clip.jobId && c.jobId === clip.jobId),
          )
          if (idx >= 0) {
            const next = [...s.clips]
            next[idx] = { ...next[idx], ...clip }
            return { clips: next }
          }
          return { clips: [clip, ...s.clips] }
        }),
      removeClip: (id) =>
        set((s) => ({ clips: s.clips.filter((c) => c.id !== id) })),
      removeFailedClips: () =>
        set((s) => ({ clips: s.clips.filter((c) => c.status !== 'failed') })),
    }),
    {
      name: 'cinema-simple-clips',
      onRehydrateStorage: () => (state) => {
        if (state?.clips?.length) {
          state.setClips(state.clips.map(reviveClip))
        }
      },
    },
  ),
)
