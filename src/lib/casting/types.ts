export interface CastMember {
  id: string
  projectId: string
  name: string
  role: 'lead' | 'supporting' | 'featured' | 'background' | 'voice_only'

  faceReferenceUrls: string[]
  loraModelId?: string
  loraStatus: 'pending' | 'training' | 'ready' | 'failed'
  lockedModelFamily?: string

  baseAppearance: CharacterAppearance
  costumesByScene: Record<string, CostumeState>
  makeupState: MakeupState
  makeupByScene: Record<string, MakeupState>

  voiceId?: string
  voiceProvider: 'elevenlabs' | 'orpheus' | 'xtts'
  voiceCharacteristics: {
    pitch: number
    speed: number
    emotion: string
    accent?: string
  }

  appearsInScenes: string[]
  totalScreenTime: number
  relationshipsTo: Array<{
    characterId: string
    relationship: string
  }>
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CharacterAppearance {
  age: string
  build: string
  height: string
  hairColor: string
  hairLength: string
  hairStyle: string
  eyeColor: string
  tattoos?: string[]
  piercings?: string[]
  scarsOrMarks?: string[]
  facialHair?: string
  promptDescription: string
}

export interface CostumeState {
  description: string
  referenceImageUrls: string[]
  colorPalette: string[]
  keyItems: string[]
}

export interface MakeupState {
  type: 'clean' | 'beauty' | 'sfx' | 'mixed'
  effects: MakeupEffect[]
  intensity: number
  promptInjection: string
}

export interface MakeupEffect {
  category: MakeupCategory
  subcategory: string
  location: BodyLocation
  intensity: number
  colorOverride?: string
  customDescription?: string
}

export type MakeupCategory =
  | 'foundation' | 'contouring' | 'eye_makeup' | 'lip_color'
  | 'blush' | 'highlight' | 'hair_styling'
  | 'blood_fresh' | 'blood_dried' | 'blood_arterial' | 'blood_seeping'
  | 'wound_cut' | 'wound_laceration' | 'wound_puncture' | 'wound_abrasion'
  | 'wound_bite' | 'wound_gunshot' | 'wound_stab'
  | 'burn_first_degree' | 'burn_second_degree' | 'burn_third_degree'
  | 'burn_chemical' | 'burn_electrical' | 'burn_friction'
  | 'bruise_fresh' | 'bruise_24hr' | 'bruise_healing' | 'bruise_old'
  | 'scar_healed' | 'scar_keloid' | 'scar_surgical' | 'scar_battle'
  | 'scar_burn_healed' | 'scar_self_inflicted'
  | 'dirt_general' | 'dirt_mud' | 'dirt_coal_dust' | 'dirt_sand'
  | 'ash_fire' | 'ash_volcanic' | 'grease_mechanical' | 'grease_cooking'
  | 'oil_motor' | 'sweat_light' | 'sweat_heavy' | 'sweat_exhaustion'
  | 'pallor_sick' | 'pallor_death' | 'infection_wound' | 'infection_skin'
  | 'necrosis' | 'jaundice' | 'sunburn'
  | 'age_10yr' | 'age_20yr' | 'age_40yr' | 'age_extreme'
  | 'undead_zombie' | 'alien_texture' | 'prosthetic_custom'
  | 'tattoo_custom' | 'vein_prominent' | 'tearstains' | 'custom'

export type BodyLocation =
  | 'full_face' | 'forehead' | 'left_cheek' | 'right_cheek' | 'nose'
  | 'chin' | 'neck' | 'left_eye' | 'right_eye' | 'lips' | 'ear'
  | 'left_arm' | 'right_arm' | 'left_hand' | 'right_hand'
  | 'chest' | 'back' | 'shoulder' | 'torso' | 'legs' | 'full_body'

export interface SceneCast {
  sceneId: string
  castMembers: Array<{
    characterId: string
    blocking: 'foreground' | 'midground' | 'background'
    isDialogue: boolean
    dialogueLines?: string[]
    action: string
    makeupOverride?: MakeupState
    costumeOverride?: CostumeState
  }>
  castingDirectorNotes?: string
}
