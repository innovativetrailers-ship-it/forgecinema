import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type LoraStatus = 'pending' | 'training' | 'ready' | 'failed'
export type CharRole = 'lead' | 'supporting' | 'featured' | 'background' | 'voice_only'
export type ModelFamily = 'auto' | 'seedance_2_0' | 'kling_3_0' | 'skyreels_v1' | 'runway_gen4_5' | 'veo3_1'

export interface VaultCharacter {
  id: string
  name: string
  role: CharRole
  description: string
  faceReferenceUrls: string[]
  costumeDescription?: string
  voiceId?: string
  modelFamily: ModelFamily
  makeupState: { type: string; description?: string; effects: string[] }
  loraStatus: LoraStatus
  loraModelId?: string
  loraJobId?: string
  triggerWord?: string
  renderCount: number
  createdAt: string
}

interface VaultStore {
  characters: VaultCharacter[]
  addCharacter: (char: Omit<VaultCharacter, 'id' | 'loraStatus' | 'renderCount' | 'createdAt'>) => VaultCharacter
  updateCharacter: (id: string, updates: Partial<VaultCharacter>) => void
  removeCharacter: (id: string) => void
  getCharacter: (id: string) => VaultCharacter | undefined
  incrementRenderCount: (id: string) => void
}

export const useVaultStore = create<VaultStore>()(
  persist(
    (set, get) => ({
      characters: [],

      addCharacter: (char) => {
        const newChar: VaultCharacter = {
          ...char,
          id: `char_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          loraStatus: 'pending',
          renderCount: 0,
          createdAt: new Date().toISOString(),
        }
        set((state) => ({ characters: [...state.characters, newChar] }))
        return newChar
      },

      updateCharacter: (id, updates) =>
        set((state) => ({
          characters: state.characters.map((c) => c.id === id ? { ...c, ...updates } : c),
        })),

      removeCharacter: (id) =>
        set((state) => ({ characters: state.characters.filter((c) => c.id !== id) })),

      getCharacter: (id) => get().characters.find((c) => c.id === id),

      incrementRenderCount: (id) =>
        set((state) => ({
          characters: state.characters.map((c) =>
            c.id === id ? { ...c, renderCount: c.renderCount + 1 } : c
          ),
        })),
    }),
    { name: 'cinema:vault' }
  )
)
