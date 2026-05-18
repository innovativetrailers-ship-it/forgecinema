# CINÉMA — FILM MODE, SERIES MODE & ADVANCED CHARACTER SYSTEMS
## Complete Cursor Build Prompt: Production-Grade Feature Expansion

> Read `CINEMA_cursor_prompt.md` and `CINEMA_swarm_upgrade.md` first. This document adds the film production pipeline, series management, multi-character casting, green screen compositing, full SFX makeup system, character recasting, environment backdrop swapping, and reference video analysis. Every system here is mandatory and must be built completely.

---

## SYSTEM 1 — MULTI-CHARACTER CASTING MANAGER

### The Problem
A scene with three characters requires each character's identity, appearance, voice, model-family lock, makeup state, and costume to be consistently tracked and injected into every shot. The current vault handles one character per scene. Multi-character casting handles unlimited characters simultaneously, tracks their interactions, and routes each character to their individually optimal model within a single scene.

### Data Model — `src/lib/casting/types.ts`

```typescript
export interface CastMember {
  id: string
  projectId: string
  name: string
  role: 'lead' | 'supporting' | 'featured' | 'background' | 'voice_only'
  
  // Identity vault
  faceReferenceUrls: string[]       // 5-20 reference images
  loraModelId?: string              // fal.ai trained LoRA for this character
  loraStatus: 'pending' | 'training' | 'ready' | 'failed'
  lockedModelFamily?: string        // model family this character is locked to
  
  // Appearance vault
  baseAppearance: CharacterAppearance
  costumesByScene: Record<string, CostumeState>  // scene_id → costume
  makeupState: MakeupState          // current default makeup/SFX state
  makeupByScene: Record<string, MakeupState>     // scene-specific overrides
  
  // Voice vault
  voiceId?: string                  // ElevenLabs voice clone ID
  voiceProvider: 'elevenlabs' | 'orpheus' | 'xtts'
  voiceCharacteristics: {
    pitch: number          // -1 to 1
    speed: number          // 0.5 to 2.0
    emotion: string        // default emotional baseline
    accent?: string
  }
  
  // Production metadata
  appearsInScenes: string[]         // scene IDs
  totalScreenTime: number           // seconds
  relationshipsTo: Array<{
    characterId: string
    relationship: string  // "enemy" | "lover" | "boss" | "sibling" etc
  }>
  notes?: string
  createdAt: Date
  updatedAt: Date
}

export interface CharacterAppearance {
  // Physical
  age: string               // "late 20s", "60s", "teenager"
  build: string             // "athletic", "slender", "heavyset"
  height: string            // "tall", "average", "short"
  // Hair
  hairColor: string
  hairLength: string
  hairStyle: string
  // Eyes
  eyeColor: string
  // Distinguishing features
  tattoos?: string[]
  piercings?: string[]
  scarsOrMarks?: string[]
  facialHair?: string
  // Base description for prompt injection
  promptDescription: string  // pre-compiled appearance string for model payloads
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
  intensity: number          // 0-1 global intensity
  promptInjection: string    // pre-compiled makeup description for prompts
}

export interface MakeupEffect {
  category: MakeupCategory
  subcategory: string
  location: BodyLocation
  intensity: number          // 0-1
  colorOverride?: string
  customDescription?: string // free-text for AI interpretation
}

export type MakeupCategory =
  // Beauty
  | 'foundation' | 'contouring' | 'eye_makeup' | 'lip_color'
  | 'blush' | 'highlight' | 'hair_styling'
  // SFX — Blood
  | 'blood_fresh' | 'blood_dried' | 'blood_arterial' | 'blood_seeping'
  // SFX — Wounds
  | 'wound_cut' | 'wound_laceration' | 'wound_puncture' | 'wound_abrasion'
  | 'wound_bite' | 'wound_gunshot' | 'wound_stab'
  // SFX — Burns
  | 'burn_first_degree' | 'burn_second_degree' | 'burn_third_degree'
  | 'burn_chemical' | 'burn_electrical' | 'burn_friction'
  // SFX — Bruising
  | 'bruise_fresh' | 'bruise_24hr' | 'bruise_healing' | 'bruise_old'
  // SFX — Scars
  | 'scar_healed' | 'scar_keloid' | 'scar_surgical' | 'scar_battle'
  | 'scar_burn_healed' | 'scar_self_inflicted'
  // SFX — Grime & Dirt
  | 'dirt_general' | 'dirt_mud' | 'dirt_coal_dust' | 'dirt_sand'
  | 'ash_fire' | 'ash_volcanic' | 'grease_mechanical' | 'grease_cooking'
  | 'oil_motor' | 'sweat_light' | 'sweat_heavy' | 'sweat_exhaustion'
  // SFX — Disease & Condition
  | 'pallor_sick' | 'pallor_death' | 'infection_wound' | 'infection_skin'
  | 'necrosis' | 'jaundice' | 'sunburn'
  // SFX — Special
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
    action: string           // what this character does in the scene
    makeupOverride?: MakeupState  // scene-specific makeup different from default
    costumeOverride?: CostumeState
  }>
  castingDirectorNotes?: string
}
```

### Cast Manager Service — `src/lib/casting/CastManager.ts`

```typescript
import { runModel1 } from '../brain/model1'
import { fal } from '../fal/client'
import { db } from '../db'
import type { CastMember, SceneCast, MakeupState, MakeupEffect } from './types'

export class CastManager {

  // ── Build multi-character generation payload ─────────────
  // Given a scene and its cast, build the enriched prompt and
  // reference payload for the generation model to handle multiple
  // consistent characters simultaneously.
  async buildMultiCharacterPayload(
    sceneCast: SceneCast,
    castMembers: CastMember[],
    sceneDescription: string
  ): Promise<{
    enrichedPrompt: string
    characterReferences: string[]
    loraIds: string[]
    modelRecommendation: string
    reasoning: string
  }> {
    const activeCast = sceneCast.castMembers.map(sc => ({
      ...sc,
      member: castMembers.find(m => m.id === sc.characterId)!,
    })).filter(sc => sc.member)

    // Model recommendation based on cast size and interactions
    let modelRecommendation: string
    let reasoning: string

    if (activeCast.length === 1) {
      // Single character — use their locked model
      const char = activeCast[0].member
      modelRecommendation = char.lockedModelFamily ?? 'seedance_2_0'
      reasoning = `Single character scene — using ${char.name}'s locked model`
    } else if (activeCast.length === 2) {
      // Two characters — Seedance 2.0 best for paired character consistency
      modelRecommendation = 'seedance_2_0'
      reasoning = 'Two-character scene — Seedance 2.0 excels at character pair consistency'
    } else if (activeCast.length <= 5) {
      // Small group — HunyuanVideo for multi-person
      modelRecommendation = 'hunyuan_1_5'
      reasoning = `${activeCast.length}-character scene — HunyuanVideo for small group dynamics`
    } else {
      // Large group / crowd
      modelRecommendation = 'hunyuan_1_5'
      reasoning = `Large cast scene (${activeCast.length} characters) — HunyuanVideo crowd specialist`
    }

    // Build enriched prompt with all character descriptions
    const characterBlocks = activeCast.map(sc => {
      const char = sc.member
      const makeupState = sc.makeupOverride ?? sc.member.makeupByScene[sceneCast.sceneId] ?? sc.member.makeupState
      const costume = sc.costumeOverride ?? sc.member.costumesByScene[sceneCast.sceneId]
      
      return `[CHARACTER: ${char.name}]
Appearance: ${char.baseAppearance.promptDescription}
Position: ${sc.blocking}
${costume ? `Wearing: ${costume.description}` : ''}
${makeupState.effects.length > 0 ? `Makeup/SFX: ${makeupState.promptInjection}` : ''}
Action: ${sc.action}
${sc.isDialogue ? `Dialogue: ${sc.dialogueLines?.join(' / ') ?? ''}` : ''}
[/CHARACTER]`
    }).join('\n\n')

    // Collect all reference images and LoRA IDs
    const characterReferences = activeCast.flatMap(sc =>
      sc.member.faceReferenceUrls.slice(0, 3)  // max 3 per character
    )
    const loraIds = activeCast
      .filter(sc => sc.member.loraStatus === 'ready' && sc.member.loraModelId)
      .map(sc => sc.member.loraModelId!)

    // Art Director enriches the prompt for the recommended model
    const promptResponse = await runModel1({
      systemPrompt: `You are the Art Director for CINÉMA. Write a video generation prompt for a multi-character scene.
Each character block defines who is in frame and what they're doing.
Write a single coherent prompt that captures all characters naturally.
Model target: ${modelRecommendation}. For Seedance 2.0: emphasise character appearance details.
For HunyuanVideo: emphasise spatial arrangement, group dynamics, energy of the crowd.
Return ONLY the prompt string.`,
      userMessage: `Scene: ${sceneDescription}\n\n${characterBlocks}`,
      requireJSON: false,
    })

    return {
      enrichedPrompt: promptResponse.content.trim(),
      characterReferences,
      loraIds,
      modelRecommendation,
      reasoning,
    }
  }

  // ── Compile makeup prompt injection ─────────────────────
  compileMakeupPrompt(makeupState: MakeupState): string {
    if (makeupState.effects.length === 0) return ''
    
    const effectDescriptions = makeupState.effects.map(effect => {
      return this.effectToPromptString(effect)
    }).filter(Boolean)

    return effectDescriptions.join(', ')
  }

  private effectToPromptString(effect: MakeupEffect): string {
    const intensity = effect.intensity < 0.33 ? 'subtle' : effect.intensity < 0.66 ? 'moderate' : 'heavy'
    const location = effect.location.replace(/_/g, ' ')
    
    const descriptions: Record<string, string> = {
      // Blood
      blood_fresh: `${intensity} fresh bright red blood on ${location}, wet and glistening`,
      blood_dried: `${intensity} dried dark brownish-red blood on ${location}, crusted and flaking`,
      blood_arterial: `arterial blood spray on ${location}, high-pressure spray pattern, bright red`,
      blood_seeping: `blood slowly seeping from wound on ${location}, dark red pooling`,
      // Wounds
      wound_cut: `${intensity} cut wound on ${location}, clean laceration with visible tissue`,
      wound_laceration: `${intensity} jagged laceration on ${location}, torn skin edges, raw tissue visible`,
      wound_puncture: `puncture wound on ${location}, entry hole, surrounding bruising`,
      wound_abrasion: `${intensity} road rash abrasion on ${location}, scraped skin, raw and bloody`,
      wound_bite: `bite wound on ${location}, tooth mark indentations, bruising and punctures`,
      wound_gunshot: `gunshot wound on ${location}, entry wound with powder burns and blood`,
      wound_stab: `stab wound on ${location}, puncture with bleeding edges`,
      // Burns
      burn_first_degree: `first degree burn on ${location}, red irritated skin, mild swelling`,
      burn_second_degree: `second degree burn on ${location}, blistered skin, weeping fluid, bright red`,
      burn_third_degree: `third degree burn on ${location}, charred blackened skin, leathery texture, no bleeding`,
      burn_chemical: `chemical burn on ${location}, irregular pattern, corrosive damage, discoloured skin`,
      burn_electrical: `electrical burn on ${location}, entry and exit marks, charred edges`,
      burn_friction: `friction burn on ${location}, raw scraped skin, road rash pattern`,
      // Bruising
      bruise_fresh: `fresh bruise on ${location}, red and slightly swollen, just forming`,
      bruise_24hr: `24-hour-old bruise on ${location}, purple and blue discolouration, swollen`,
      bruise_healing: `healing bruise on ${location}, yellow-green edges, purple centre, fading`,
      bruise_old: `old fading bruise on ${location}, yellow-green discolouration, nearly healed`,
      // Scars
      scar_healed: `healed scar on ${location}, lighter skin, slightly raised or indented`,
      scar_keloid: `raised keloid scar on ${location}, thick raised tissue, pink-purple discolouration`,
      scar_surgical: `surgical scar on ${location}, thin straight line, healed with slight shine`,
      scar_battle: `battle scar on ${location}, jagged healed wound, weathered tough skin`,
      // Grime
      dirt_general: `${intensity} dirt and grime on ${location}, brown-grey soil smearing`,
      dirt_mud: `${intensity} wet mud on ${location}, dark brown splatters and coating`,
      dirt_coal_dust: `coal dust on ${location}, fine black powder coating, mining aesthetic`,
      ash_fire: `fire ash on ${location}, grey-white ash coating, post-fire survivor look`,
      ash_volcanic: `volcanic ash on ${location}, fine grey powder, apocalyptic`,
      grease_mechanical: `mechanical grease on ${location}, dark grey-black oily smears, mechanic look`,
      oil_motor: `motor oil on ${location}, dark iridescent sheen, workshop look`,
      sweat_heavy: `heavy sweat on ${location}, glistening wet skin, droplets, exertion`,
      sweat_exhaustion: `extreme exhaustion sweat on ${location}, completely drenched, heat stroke look`,
      // Disease
      pallor_sick: `sickly pallor on ${location}, grey-white skin tone, dark circles`,
      pallor_death: `death pallor on ${location}, waxy grey-blue skin, no life colour`,
      infection_wound: `infected wound on ${location}, red angry edges, yellow pus, swelling`,
      infection_skin: `skin infection on ${location}, red inflamed patches, pustules`,
      necrosis: `necrotic tissue on ${location}, blackened dead skin, gangrene`,
      jaundice: `jaundice on ${location}, yellow-orange skin tone, scleral yellowing`,
      // Age
      age_10yr: `10 years of aging on ${location}, fine lines, slight sagging, age spots`,
      age_20yr: `20 years of aging on ${location}, wrinkles, prominent lines, thinning skin`,
      age_40yr: `40 years of aging on ${location}, deep wrinkles, heavy jowls, age-spotted`,
      age_extreme: `extreme elderly aging on ${location}, paper-thin wrinkled skin, liver spots, skeletal`,
      // Special
      undead_zombie: `zombie decomposition on ${location}, grey-green skin, rotting flesh, exposed bone`,
      tearstains: `tear stains on ${location}, streaked mascara, red eyes, emotional breakdown`,
    }

    if (effect.customDescription) return effect.customDescription
    return descriptions[effect.category] ?? `${effect.category.replace(/_/g, ' ')} on ${location}`
  }
}
```

---

## SYSTEM 2 — SFX MAKEUP ENGINE

### `src/lib/makeup/SFXMakeupEngine.ts`

```typescript
import { fal } from '../fal/client'
import { runModel1 } from '../brain/model1'
import type { MakeupState, MakeupEffect, CastMember } from '../casting/types'
import { CastManager } from '../casting/CastManager'

export class SFXMakeupEngine {
  private castManager = new CastManager()

  // ── MODE 1: Pre-generation makeup injection ──────────────
  // Most efficient — bakes makeup into the generation prompt.
  // The model renders the character WITH the makeup from scratch.
  // Used for: all standard generation shots.
  injectIntoPrompt(basePrompt: string, makeupState: MakeupState): string {
    if (makeupState.effects.length === 0) return basePrompt
    const makeupDescription = this.castManager.compileMakeupPrompt(makeupState)
    return `${basePrompt}\n\nSFX makeup and appearance: ${makeupDescription}`
  }

  // ── MODE 2: Post-generation makeup application ───────────
  // Applies SFX makeup to an already-generated video.
  // Used for: makeup changes mid-scene, progressive damage effects,
  // makeup applied AFTER generation without regenerating the scene.
  async applyMakeupPostGeneration(params: {
    videoUrl: string
    effects: MakeupEffect[]
    characterFaceUrl?: string    // reference face for alignment
    intensity: number
  }): Promise<string> {
    const makeupState: MakeupState = {
      type: 'sfx',
      effects: params.effects,
      intensity: params.intensity,
      promptInjection: '',
    }
    makeupState.promptInjection = this.castManager.compileMakeupPrompt(makeupState)

    // Use img2img diffusion with inpainting for face/body regions
    // Extract middle frame, apply makeup, use as reference for video
    const frameResult = await fal.run('fal-ai/video-frame-extractor', {
      video_url: params.videoUrl,
      timestamp: 0.5,
    }) as { image_url: string }

    // Apply makeup via controlled inpainting
    const makeupResult = await fal.run('fal-ai/flux-general/image-to-image', {
      image_url: frameResult.image_url,
      prompt: `Apply realistic SFX makeup to this face/body: ${makeupState.promptInjection}. Keep everything else identical, only modify the appearance as described. Ultra-realistic, film-quality.`,
      strength: Math.min(0.35 + params.intensity * 0.3, 0.65),  // controlled strength
      num_inference_steps: 40,
    }) as { images: Array<{ url: string }> }

    // Apply the makeup frame as a V2V reference to the full video
    // This ensures temporal consistency across all frames
    const appliedVideoResult = await fal.run('fal-ai/seedance-v1-lite-i2v', {
      image_url: makeupResult.images[0].url,
      prompt: makeupState.promptInjection,
      duration: 5,
    }) as { video: { url: string } }

    return appliedVideoResult.video.url
  }

  // ── MODE 3: Reference-based makeup transfer ──────────────
  // Upload a reference image showing the desired makeup look.
  // The system transfers that exact makeup to the character.
  // Powered by Stable-Makeup (SIGGRAPH 2025) approach.
  async transferMakeupFromReference(params: {
    sourceVideoUrl: string       // video of character WITHOUT makeup
    makeupReferenceImageUrl: string  // image showing desired makeup
    characterFaceUrl?: string
    intensity: number
  }): Promise<string> {
    // Extract character frame
    const frame = await fal.run('fal-ai/video-frame-extractor', {
      video_url: params.sourceVideoUrl,
      timestamp: 0.5,
    }) as { image_url: string }

    // Describe the reference makeup using Model 1 Vision
    const makeupDescription = await runModel1({
      systemPrompt: 'You are an expert SFX makeup artist and visual analyst. Describe the makeup or special effects visible on the face/body in this reference image in precise technical terms for a generation model. Be specific about colours, textures, locations, and intensity. Return only the description.',
      userMessage: 'Describe all makeup and SFX effects visible in this reference image.',
      images: [params.makeupReferenceImageUrl],
      requireJSON: false,
    })

    // Apply via controlled img2img with the description and reference
    const transferred = await fal.run('fal-ai/flux-general/image-to-image', {
      image_url: frame.image_url,
      prompt: `Apply this exact makeup/SFX to this person's face: ${makeupDescription.content}. Reference image style. Film-quality, photorealistic. Keep all other features identical.`,
      strength: 0.35 + params.intensity * 0.25,
    }) as { images: Array<{ url: string }> }

    // Extend to full video using the makeup'd frame as guide
    const result = await fal.run('fal-ai/seedance-v1-lite-i2v', {
      image_url: transferred.images[0].url,
      prompt: makeupDescription.content,
      duration: 5,
    }) as { video: { url: string } }

    return result.video.url
  }

  // ── MODE 4: Progressive damage (evolving SFX across shots) ─
  // For scenes where character progressively gets more damaged —
  // blood accumulates, burns worsen, bruises develop.
  // Each shot in a progression gets incrementally intensified effects.
  buildProgressionStates(
    baseState: MakeupState,
    progressionSteps: number,
    progressionType: 'damage' | 'healing' | 'dirtying' | 'ageing'
  ): MakeupState[] {
    return Array.from({ length: progressionSteps }, (_, i) => {
      const progressFactor = (i + 1) / progressionSteps
      return {
        ...baseState,
        intensity: progressFactor,
        effects: baseState.effects.map(effect => ({
          ...effect,
          intensity: progressFactor * effect.intensity,
          // For damage progression: escalate severity
          category: progressionType === 'damage'
            ? this.escalateEffect(effect.category, progressFactor)
            : effect.category,
        })),
        promptInjection: '',  // will be recompiled
      }
    })
  }

  private escalateEffect(category: string, factor: number): any {
    // Escalate wound/burn severity as damage progresses
    if (category === 'bruise_fresh' && factor > 0.5) return 'bruise_24hr'
    if (category === 'bruise_24hr' && factor > 0.8) return 'bruise_healing'
    if (category === 'burn_first_degree' && factor > 0.6) return 'burn_second_degree'
    if (category === 'burn_second_degree' && factor > 0.8) return 'burn_third_degree'
    return category
  }

  // ── API endpoint handler ─────────────────────────────────
  async handleCustomRequest(params: {
    videoUrl: string
    naturalLanguageRequest: string  // e.g. "make her look like she was in a fire"
    characterId?: string
    intensity?: number
  }): Promise<{ videoUrl: string; appliedEffects: MakeupEffect[] }> {
    // Model 1 interprets the natural language request into specific effects
    const interpretationResponse = await runModel1({
      systemPrompt: `You are an expert SFX makeup designer. Interpret the user's request into specific makeup effects.
Return ONLY valid JSON:
{
  "effects": [
    {
      "category": "exact_category_string",
      "subcategory": "description",
      "location": "body_location_string",
      "intensity": 0.0-1.0,
      "customDescription": "optional additional detail"
    }
  ],
  "overallIntensity": 0.0-1.0,
  "artDirectorNotes": "how to approach this in generation"
}`,
      userMessage: `Request: "${params.naturalLanguageRequest}"`,
      requireJSON: true,
    })

    const interpretation = JSON.parse(interpretationResponse.content)
    const makeupState: MakeupState = {
      type: 'sfx',
      effects: interpretation.effects,
      intensity: params.intensity ?? interpretation.overallIntensity,
      promptInjection: '',
    }

    const resultUrl = await this.applyMakeupPostGeneration({
      videoUrl: params.videoUrl,
      effects: interpretation.effects,
      intensity: interpretation.overallIntensity,
    })

    return { videoUrl: resultUrl, appliedEffects: interpretation.effects }
  }
}
```

---

## SYSTEM 3 — GREEN SCREEN & BACKGROUND SWAP

### `src/lib/greenscreen/GreenScreenEngine.ts`

```typescript
import { fal } from '../fal/client'
import { runModel1 } from '../brain/model1'
import ffmpeg from 'fluent-ffmpeg'
import { r2 } from '../storage/r2'
import path from 'path'
import os from 'os'
import fs from 'fs/promises'

export type BackdropSource =
  | 'ai_generated'      // prompt → Veo 3.1/Wan generated background
  | 'location_vault'    // from project location vault
  | 'mapillary'         // real-world Mapillary street image
  | 'cesium_aerial'     // Cesium Ion aerial render
  | 'user_uploaded'     // user uploads custom image or video
  | 'hdri_environment'  // spherical HDRI environment
  | 'solid_colour'      // simple colour backdrop

export interface BackdropConfig {
  source: BackdropSource
  // For ai_generated
  prompt?: string
  generationModel?: string    // 'veo_3_1' | 'wan_2_2' | 'seedance_2_0'
  // For location_vault
  locationId?: string
  // For user_uploaded
  uploadedUrl?: string
  // For hdri_environment
  hdriUrl?: string
  // For solid_colour
  color?: string              // hex
  // Common
  timeOfDay?: string          // 'dawn' | 'morning' | 'golden_hour' | 'night'
  weather?: string
  lightingMatchToForeground?: boolean  // IC-Light match
  addShadowsToBackdrop?: boolean
  depthBlur?: boolean         // blur background based on depth map
  depthBlurAmount?: number    // 0-1
}

export interface GreenScreenJob {
  sourceVideoUrl: string      // video of character to extract
  extractionMode: 'chroma_key' | 'ai_matting' | 'depth_matting'
  // Chroma key settings
  chromaColour?: 'green' | 'blue' | 'custom'
  customChromaHex?: string
  spillSuppression?: boolean
  edgeRefinement?: number     // 0-1
  // AI matting settings  
  subjectType?: 'person' | 'object' | 'animal' | 'multiple_people'
  // Background
  backdrop: BackdropConfig
  // Output
  lightingHarmonise?: boolean
  outputFormat?: 'mp4' | 'webm_alpha'
}

export class GreenScreenEngine {

  async processGreenScreen(job: GreenScreenJob): Promise<string> {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cinema-gs-'))

    try {
      // STEP 1: Extract foreground subject
      const foregroundData = await this.extractForeground(job, tmp)

      // STEP 2: Generate or fetch backdrop
      const backdropUrl = await this.resolveBackdrop(job.backdrop, foregroundData.lightingInfo)

      // STEP 3: Harmonise lighting between foreground and backdrop
      let harmonisedForeground = foregroundData.alphaVideoUrl
      if (job.lightingHarmonise) {
        harmonisedForeground = await this.harmoniseLighting(
          foregroundData.alphaVideoUrl, backdropUrl, foregroundData.lightingInfo
        )
      }

      // STEP 4: Composite foreground over backdrop
      const composited = await this.composite(
        harmonisedForeground,
        backdropUrl,
        foregroundData.depthMapUrl,
        job.backdrop.depthBlur ?? false,
        job.backdrop.depthBlurAmount ?? 0.3,
        job.backdrop.addShadowsToBackdrop ?? true,
        tmp
      )

      const outputUrl = await r2.uploadFile(composited, `greenscreen/${Date.now()}.mp4`)
      return outputUrl

    } finally {
      await fs.rm(tmp, { recursive: true, force: true })
    }
  }

  // ── Extract foreground from source video ─────────────────
  private async extractForeground(
    job: GreenScreenJob,
    tmpDir: string
  ): Promise<{
    alphaVideoUrl: string
    depthMapUrl?: string
    lightingInfo: LightingInfo
  }> {
    if (job.extractionMode === 'chroma_key') {
      // Traditional FFmpeg chromakey for physical green/blue screen footage
      const outputPath = path.join(tmpDir, 'foreground_alpha.webm')
      const sourceLocal = path.join(tmpDir, 'source.mp4')
      await this.downloadFile(job.sourceVideoUrl, sourceLocal)

      const keyColour = job.chromaColour === 'green' ? '0x00ff00'
        : job.chromaColour === 'blue' ? '0x0000ff'
        : job.customChromaHex ?? '0x00ff00'

      await new Promise<void>((res, rej) => {
        ffmpeg(sourceLocal)
          .videoFilter([
            `chromakey=${keyColour}:similarity=0.3:blend=0.05`,
            job.spillSuppression ? 'despill=type=green' : null,
            job.edgeRefinement ? `morpho=mode=open:width=${Math.round(job.edgeRefinement! * 5)}` : null,
          ].filter(Boolean) as string[])
          .outputOptions(['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-auto-alt-ref', '0'])
          .output(outputPath)
          .on('end', () => res())
          .on('error', rej)
          .run()
      })

      const alphaUrl = await r2.uploadFile(outputPath, `alpha/${Date.now()}.webm`)
      const lighting = await this.extractLightingInfo(job.sourceVideoUrl)
      return { alphaVideoUrl: alphaUrl, lightingInfo: lighting }

    } else if (job.extractionMode === 'ai_matting') {
      // fal.ai BiRefNet for high-quality AI subject segmentation (no green screen needed)
      const result = await fal.run('fal-ai/birefnet-general', {
        image_url: job.sourceVideoUrl,
        model: 'General Use (Heavy)',
        operating_resolution: '1024x1024',
        output_format: 'webp',
        refine_foreground: true,
      }) as { image: { url: string } }

      // For video: process each frame via BiRefNet, reassemble
      // This is expensive but produces the highest quality matte
      const alphaUrl = result.image.url
      const depth = await fal.run('fal-ai/depth-anything-v2', {
        image_url: job.sourceVideoUrl,
      }) as { image_url: string }

      const lighting = await this.extractLightingInfo(job.sourceVideoUrl)
      return { alphaVideoUrl: alphaUrl, depthMapUrl: depth.image_url, lightingInfo: lighting }

    } else {
      // Depth matting — use depth map to separate near foreground from background
      const depth = await fal.run('fal-ai/depth-anything-v2', {
        image_url: job.sourceVideoUrl,
      }) as { image_url: string }

      const rembgResult = await fal.run('fal-ai/imageutils/rembg', {
        image_url: job.sourceVideoUrl,
      }) as { image: { url: string } }

      const lighting = await this.extractLightingInfo(job.sourceVideoUrl)
      return { alphaVideoUrl: rembgResult.image.url, depthMapUrl: depth.image_url, lightingInfo: lighting }
    }
  }

  // ── Generate or fetch backdrop ───────────────────────────
  private async resolveBackdrop(
    config: BackdropConfig,
    lightingInfo: LightingInfo
  ): Promise<string> {
    switch (config.source) {
      case 'ai_generated': {
        // Generate photorealistic background matching lighting conditions
        const bgPrompt = `${config.prompt}. ${config.timeOfDay ?? 'natural daylight'}, ${config.weather ?? 'clear weather'}. No people in frame. Photorealistic environment, wide shot, background plate for compositing.`
        const model = config.generationModel ?? 'veo_3_1'
        // Route to the appropriate model for background generation
        const result = await fal.run('fal-ai/wan-t2v-14b', {
          prompt: bgPrompt, num_frames: 81,
        }) as { video: { url: string } }
        return result.video.url
      }

      case 'user_uploaded':
        return config.uploadedUrl!

      case 'location_vault': {
        const { db } = await import('../db')
        const location = await db.vaultLocation.findUnique({ where: { id: config.locationId! } })
        return location?.referenceUrls?.[0] ?? ''
      }

      case 'hdri_environment': {
        // Convert HDRI to background video via IC-Light
        const result = await fal.run('fal-ai/ic-light', {
          image_url: config.hdriUrl!,
          prompt: `Panoramic environment background, ${config.timeOfDay ?? 'natural light'}`,
        }) as { image_url: string }
        return result.image_url
      }

      case 'solid_colour': {
        // Generate solid colour frame via FFmpeg
        // Return a data URL or upload a generated colour plate
        return `solid:${config.color ?? '#1a1a2e'}`
      }

      default:
        return config.uploadedUrl ?? ''
    }
  }

  // ── Harmonise lighting between FG and BG ─────────────────
  private async harmoniseLighting(
    foregroundUrl: string,
    backdropUrl: string,
    lightingInfo: LightingInfo
  ): Promise<string> {
    // Extract lighting from backdrop
    const backdropLighting = await runModel1({
      systemPrompt: 'Analyse the lighting in this image. Return: {"direction": "left|right|above|below|front|back", "temperature": "warm|neutral|cool", "intensity": "soft|medium|hard", "ambient": "description"}',
      userMessage: 'Analyse the lighting direction and quality in this backdrop image.',
      images: [backdropUrl],
      requireJSON: true,
    })
    const bdLighting = JSON.parse(backdropLighting.content)

    // Relight foreground to match backdrop via IC-Light
    const relitResult = await fal.run('fal-ai/ic-light', {
      image_url: foregroundUrl,
      prompt: `Relight to match: ${bdLighting.direction} ${bdLighting.temperature} lighting, ${bdLighting.intensity} quality, ${bdLighting.ambient}`,
    }) as { image_url: string }

    return relitResult.image_url
  }

  // ── FFmpeg composite: FG alpha over BG with depth blur ───
  private async composite(
    foregroundAlphaUrl: string,
    backdropUrl: string,
    depthMapUrl?: string,
    depthBlur?: boolean,
    depthBlurAmount?: number,
    addShadows?: boolean,
    tmpDir?: string
  ): Promise<string> {
    const fgPath = path.join(tmpDir!, 'fg_alpha.webm')
    const bgPath = path.join(tmpDir!, 'backdrop.mp4')
    const outPath = path.join(tmpDir!, 'composited.mp4')

    await Promise.all([
      this.downloadFile(foregroundAlphaUrl, fgPath),
      this.downloadFile(backdropUrl, bgPath),
    ])

    await new Promise<void>((res, rej) => {
      const cmd = ffmpeg()
        .input(bgPath)    // [0] backdrop
        .input(fgPath)    // [1] foreground with alpha

      const filters: string[] = []

      if (depthBlur && depthMapUrl) {
        // Apply depth-based blur to backdrop (bokeh effect)
        filters.push(`[0:v]boxblur=${Math.round((depthBlurAmount ?? 0.3) * 10)}[bgblurred]`)
        filters.push(`[bgblurred][1:v]overlay=0:0[out]`)
      } else {
        // Simple alpha composite
        filters.push(`[0:v][1:v]overlay=0:0[out]`)
      }

      cmd
        .complexFilter(filters)
        .outputOptions(['-map', '[out]', '-map', '1:a?', '-c:v', 'libx264', '-crf', '16', '-c:a', 'aac'])
        .output(outPath)
        .on('end', () => res())
        .on('error', rej)
        .run()
    })

    return outPath
  }

  private async extractLightingInfo(videoUrl: string): Promise<LightingInfo> {
    const frame = await fal.run('fal-ai/video-frame-extractor', { video_url: videoUrl, timestamp: 0.5 }) as { image_url: string }
    const analysis = await runModel1({
      systemPrompt: 'Analyse lighting. Return JSON: {"direction": "string", "temperature_kelvin": number, "intensity": "soft|medium|hard", "shadows": "direction"}',
      userMessage: 'Analyse the lighting in this frame.',
      images: [frame.image_url],
      requireJSON: true,
    })
    return JSON.parse(analysis.content)
  }

  private async downloadFile(url: string, dest: string): Promise<void> {
    if (url.startsWith('solid:')) return  // handle solid colour separately
    const resp = await fetch(url)
    const stream = (await import('fs')).createWriteStream(dest)
    await (await import('stream/promises')).pipeline(resp.body as any, stream)
  }
}

interface LightingInfo {
  direction: string
  temperature_kelvin: number
  intensity: string
  shadows: string
}
```

---

## SYSTEM 4 — CHARACTER RECASTING ENGINE

### `src/lib/casting/Recaster.ts`

```typescript
import { fal } from '../fal/client'
import { runModel1 } from '../brain/model1'
import { r2 } from '../storage/r2'
import type { CastMember } from './types'

export class Recaster {

  // ── Swap one character for another in a clip ─────────────
  // Replaces Character A's face/identity with Character B
  // while preserving all body language, motion, and environment.
  async recastCharacter(params: {
    sourceVideoUrl: string         // video with original character
    originalCharacter: CastMember  // who to remove
    replacementCharacter: CastMember  // who to insert
    recastScope: 'face_only' | 'full_character' | 'silhouette_only'
    preserveVoice: boolean         // if false, re-synthesise with new character's voice
    intensity: number              // how complete the swap is (0.7-1.0 recommended)
  }): Promise<string> {

    if (params.recastScope === 'face_only') {
      return this.swapFaceOnly(params)
    } else if (params.recastScope === 'full_character') {
      return this.swapFullCharacter(params)
    } else {
      return this.swapSilhouette(params)
    }
  }

  // ── Face-only swap ────────────────────────────────────────
  private async swapFaceOnly(params: RecastParams): Promise<string> {
    const { sourceVideoUrl, replacementCharacter, intensity } = params

    // Use fal.ai face swap model with the replacement character's reference
    const bestReference = replacementCharacter.faceReferenceUrls[0]
    if (!bestReference) throw new Error('Replacement character has no face references')

    // For video face swap: process key frames, then use V2V for temporal consistency
    const frame = await fal.run('fal-ai/video-frame-extractor', {
      video_url: sourceVideoUrl, timestamp: 0.5,
    }) as { image_url: string }

    // Apply face swap on the key frame
    const faceSwapped = await fal.run('fal-ai/face-swap-v2', {
      source_image_url: frame.image_url,        // original face
      reference_image_url: bestReference,        // replacement face
      strength: intensity,
    }).catch(async () => {
      // Fallback: use IP-Adapter face injection via inpainting
      return fal.run('fal-ai/flux-general/image-to-image', {
        image_url: frame.image_url,
        prompt: `Replace the face in this image with: ${replacementCharacter.baseAppearance.promptDescription}. Keep all other aspects of the image identical including body, clothes, and background.`,
        strength: intensity * 0.4,
      })
    }) as { image: { url: string } | null; images?: Array<{ url: string }> }

    const swappedFrameUrl = (faceSwapped as any).image?.url ?? (faceSwapped as any).images?.[0]?.url

    // Apply the swapped face across the whole video via Seedance V2V
    const videoResult = await fal.run('fal-ai/seedance-v1-pro-i2v', {
      image_url: swappedFrameUrl,
      prompt: `${replacementCharacter.baseAppearance.promptDescription}, same action and motion as original`,
      duration: 5,
    }) as { video: { url: string } }

    return videoResult.video.url
  }

  // ── Full character swap (face + body) ────────────────────
  private async swapFullCharacter(params: RecastParams): Promise<string> {
    const { sourceVideoUrl, replacementCharacter } = params

    // Extract motion data from original character
    const poseResult = await fal.run('fal-ai/dwpose', {
      image_url: sourceVideoUrl,  // extract pose from video
    }) as { image_url: string }

    // Generate replacement character with matching pose via ControlNet
    const recast = await fal.run('fal-ai/flux-controlnet', {
      control_image_url: poseResult.image_url,
      prompt: `${replacementCharacter.baseAppearance.promptDescription}, same pose and action`,
      controlnet_type: 'pose',
    }) as { images: Array<{ url: string }> }

    // Animate with Seedance maintaining replacement character identity
    const animated = await fal.run('fal-ai/seedance-v1-pro-i2v', {
      image_url: recast.images[0].url,
      image_references: replacementCharacter.faceReferenceUrls.slice(0, 3),
      prompt: `${replacementCharacter.baseAppearance.promptDescription}, same motion as original video`,
      duration: 5,
    }) as { video: { url: string } }

    return animated.video.url
  }

  // ── Silhouette swap (keep silhouette, change identity) ───
  private async swapSilhouette(params: RecastParams): Promise<string> {
    const { sourceVideoUrl, replacementCharacter } = params

    // Keep motion and silhouette, only change surface appearance
    const frame = await fal.run('fal-ai/video-frame-extractor', {
      video_url: sourceVideoUrl, timestamp: 0.5,
    }) as { image_url: string }

    const restyle = await fal.run('fal-ai/flux-general/image-to-image', {
      image_url: frame.image_url,
      prompt: replacementCharacter.baseAppearance.promptDescription,
      strength: 0.55,  // preserve silhouette, change appearance
    }) as { images: Array<{ url: string }> }

    const result = await fal.run('fal-ai/seedance-v1-pro-i2v', {
      image_url: restyle.images[0].url,
      prompt: replacementCharacter.baseAppearance.promptDescription,
      duration: 5,
    }) as { video: { url: string } }

    return result.video.url
  }

  // ── Recast across entire project ─────────────────────────
  // Replace a character in EVERY shot they appear in
  async recastAcrossProject(params: {
    projectId: string
    originalCharacterId: string
    replacementCharacter: CastMember
    recastScope: 'face_only' | 'full_character'
    userId: string
  }): Promise<{ updatedClips: number; jobIds: string[] }> {
    const { db } = await import('../db')
    const { redis } = await import('../redis')

    // Find all render jobs that used this character
    const affectedJobs = await db.renderJob.findMany({
      where: {
        projectId: params.projectId,
        status: 'COMPLETE',
        inputPayload: { path: ['characterIds'], array_contains: params.originalCharacterId },
      }
    })

    // Queue recast jobs for each affected clip
    const jobIds: string[] = []
    for (const job of affectedJobs) {
      const recastJobId = `recast_${job.id}_${Date.now()}`
      await redis.lpush('recast:queue', JSON.stringify({
        id: recastJobId,
        originalJobId: job.id,
        originalVideoUrl: job.outputUrl,
        originalCharacterId: params.originalCharacterId,
        replacementCharacter: params.replacementCharacter,
        recastScope: params.recastScope,
        userId: params.userId,
      }))
      jobIds.push(recastJobId)
    }

    return { updatedClips: affectedJobs.length, jobIds }
  }
}

interface RecastParams {
  sourceVideoUrl: string
  originalCharacter: CastMember
  replacementCharacter: CastMember
  recastScope: 'face_only' | 'full_character' | 'silhouette_only'
  preserveVoice: boolean
  intensity: number
}
```

---

## SYSTEM 5 — FILM MODE

### Film Project Data Schema — add to `prisma/schema.prisma`

```prisma
model FilmProject {
  id              String          @id @default(cuid())
  userId          String
  title           String
  type            FilmType
  logline         String?
  synopsis        String?
  genre           String[]
  targetRuntime   Int             // minutes
  rating          String?         // "PG" | "PG-13" | "R" | "NR"
  status          FilmStatus      @default(DEVELOPMENT)
  
  // Production design
  colourPalette   Json?           // dominant colours, mood board references
  cinematicStyle  String?         // "noir", "naturalistic", "stylised", etc
  aspectRatio     String          @default("2.39:1")
  soundDesignNotes String?
  musicStyle      String?
  
  // Structure
  acts            Act[]
  cast            FilmCastMember[]
  locations       FilmLocation[]
  
  // Output
  finalVideoUrl   String?
  exportStatus    String?
  
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  
  user            User            @relation(fields: [userId], references: [id])
}

enum FilmType {
  FEATURE_FILM
  SHORT_FILM
  DOCUMENTARY
  MUSIC_VIDEO
  COMMERCIAL
  EXPERIMENTAL
}

enum FilmStatus {
  DEVELOPMENT
  PRE_PRODUCTION
  PRODUCTION
  POST_PRODUCTION
  COMPLETE
  RELEASED
}

model Act {
  id              String          @id @default(cuid())
  filmProjectId   String
  number          Int             // 1, 2, 3
  title           String?
  description     String?
  sequences       Sequence[]
  film            FilmProject     @relation(fields: [filmProjectId], references: [id])
}

model Sequence {
  id              String          @id @default(cuid())
  actId           String
  title           String
  description     String?
  scenes          FilmScene[]
  act             Act             @relation(fields: [actId], references: [id])
}

model FilmScene {
  id              String          @id @default(cuid())
  sequenceId      String
  sceneNumber     String          // "1", "2A", "INT-3"
  intExt          String          // "INT" | "EXT"
  location        String
  timeOfDay       String          // "DAY" | "NIGHT" | "DAWN" | "DUSK"
  heading         String          // Full scene heading e.g. "INT. WAREHOUSE - NIGHT"
  actionLines     String          // scene action description
  dialogue        Json            // array of {character, line, parenthetical}
  characterIds    String[]        // cast appearing in this scene
  locationId      String?
  shotList        Json?           // generated shot list
  generatedClips  String[]        // R2 URLs of generated clips
  status          String          @default("scripted")
  productionNotes String?
  sequence        Sequence        @relation(fields: [sequenceId], references: [id])
}

model FilmCastMember {
  id              String          @id @default(cuid())
  filmProjectId   String
  vaultCharacterId String         // references VaultCharacter
  characterName   String
  role            String          // "LEAD" | "SUPPORTING" | "FEATURED" | "EXTRA"
  actorNotes      String?
  film            FilmProject     @relation(fields: [filmProjectId], references: [id])
}

model FilmLocation {
  id              String          @id @default(cuid())
  filmProjectId   String
  vaultLocationId String?
  name            String
  description     String
  film            FilmProject     @relation(fields: [filmProjectId], references: [id])
}

// ── SERIES SCHEMA ─────────────────────────────────────────

model SeriesProject {
  id              String          @id @default(cuid())
  userId          String
  title           String
  type            SeriesType
  platform        String          // "netflix" | "youtube" | "tiktok" | "instagram" | "custom"
  episodeFormat   Json            // { runtime: number, structure: string[] }
  seriesBible     Json            // premise, world, tone, formula
  recurringCastIds String[]
  recurringLocationIds String[]
  seasons         Season[]
  status          String          @default("development")
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  user            User            @relation(fields: [userId], references: [id])
}

enum SeriesType {
  TV_DRAMA
  TV_COMEDY
  WEB_SERIES
  SOCIAL_SERIES
  DOCUMENTARY_SERIES
  ANTHOLOGY
}

model Season {
  id              String          @id @default(cuid())
  seriesId        String
  seasonNumber    Int
  title           String?
  seasonArc       String?
  episodeCount    Int             @default(0)
  episodes        Episode[]
  status          String          @default("planned")
  series          SeriesProject   @relation(fields: [seriesId], references: [id])
}

model Episode {
  id              String          @id @default(cuid())
  seasonId        String
  episodeNumber   Int
  title           String
  logline         String?
  previouslyOn    String?
  coldOpen        String?
  actBreaks       Json            // array of act descriptions
  sceneIds        String[]
  tags            String[]        // mood, theme tags
  targetRuntime   Int             // minutes
  finalVideoUrl   String?
  status          String          @default("planned")
  season          Season          @relation(fields: [seasonId], references: [id])
}
```

---

## SYSTEM 6 — FILM MODE SERVICE

### `src/lib/film/FilmDirector.ts`

```typescript
import { runModel1 } from '../brain/model1'
import { callCouncil } from '../brain/council'
import { SwarmRouter } from '../swarm/SwarmRouter'
import { LongFormOrchestrator } from '../swarm/LongFormOrchestrator'
import { db } from '../db'

export class FilmDirector {
  private swarm = new SwarmRouter()
  private longForm = new LongFormOrchestrator()

  // ── Parse Fountain screenplay into scene objects ─────────
  async parseFountainScript(fountainText: string): Promise<ParsedScript> {
    const response = await runModel1({
      systemPrompt: `You are a professional script supervisor. Parse this Fountain-format screenplay into structured JSON.
Return: {
  "title": string,
  "total_scenes": number,
  "acts": [{ "number": 1, "scenes": [{ "number": "1", "heading": "INT. LOCATION - TIME", "int_ext": "INT|EXT", "location": string, "time_of_day": "DAY|NIGHT|DAWN|DUSK", "action": string, "characters": [string], "dialogue": [{"character": string, "parenthetical": string|null, "line": string}], "estimated_duration_seconds": number }] }]
}`,
      userMessage: fountainText,
      requireJSON: true,
      useAgenticLoop: true,
    })

    return JSON.parse(response.content)
  }

  // ── Generate shot list for a scene ──────────────────────
  async generateShotList(scene: FilmScene, castMembers: any[]): Promise<Shot[]> {
    const response = await runModel1({
      systemPrompt: `You are a film director breaking down a scene into shots. Generate a professional shot list.
For each shot include: shot_type (ECU/CU/MS/WS/EWS/POV/OTS), camera_movement, description, duration_seconds, scene_category (from the swarm routing matrix).
Return JSON array of shots.`,
      userMessage: `Scene: ${scene.heading}\n\nAction: ${scene.actionLines}\n\nCharacters: ${scene.characterIds.join(', ')}\n\nDialogue: ${JSON.stringify(scene.dialogue)}`,
      requireJSON: true,
    })

    return JSON.parse(response.content)
  }

  // ── Produce a full act ───────────────────────────────────
  async produceAct(params: {
    filmProjectId: string
    actId: string
    tier: 'Draft' | 'Studio' | 'Blockbuster'
    userId: string
  }): Promise<string> {
    const act = await db.act.findUnique({
      where: { id: params.actId },
      include: { sequences: { include: { scenes: true } } },
    })
    if (!act) throw new Error('Act not found')

    // Collect all scenes across sequences
    const allScenes = act.sequences.flatMap(seq => seq.scenes)

    // Generate shot lists for all scenes
    const allShots = await Promise.all(
      allScenes.map(scene => this.generateShotList(scene as any, []))
    )

    // Flatten into a single shot list with continuity
    const flatShots = allShots.flat().map((shot, i) => ({
      ...shot,
      shot_id: `shot_${String(i + 1).padStart(4, '0')}`,
      sequence_index: i + 1,
    }))

    // Dispatch via long-form orchestrator
    const shotList = {
      project_id: params.filmProjectId,
      tier: params.tier,
      total_duration_seconds: flatShots.reduce((s, sh) => s + sh.duration_seconds, 0),
      shots: flatShots,
      estimated_total_credits: 0,
      model_distribution: {},
      cost_breakdown: {},
    }

    return this.longForm.renderLongForm({
      shotList: shotList as any,
      userId: params.userId,
      projectId: params.filmProjectId,
    })
  }

  // ── AI Director: produce entire film from script ─────────
  async produceFullFilm(params: {
    filmProjectId: string
    tier: 'Draft' | 'Studio' | 'Blockbuster'
    userId: string
  }): Promise<string> {
    const film = await db.filmProject.findUnique({
      where: { id: params.filmProjectId },
      include: { acts: { include: { sequences: { include: { scenes: true } } } } },
    })
    if (!film) throw new Error('Film project not found')

    // Produce each act sequentially, maintaining continuity context
    const actUrls: string[] = []
    for (const act of film.acts.sort((a, b) => a.number - b.number)) {
      const actUrl = await this.produceAct({
        filmProjectId: params.filmProjectId,
        actId: act.id,
        tier: params.tier,
        userId: params.userId,
      })
      actUrls.push(actUrl)
    }

    // Final assembly of all acts
    return this.assembleActs(actUrls, film.title)
  }

  private async assembleActs(actUrls: string[], title: string): Promise<string> {
    const { execSync } = await import('child_process')
    const os = await import('os')
    const path = await import('path')
    const fs = await import('fs/promises')

    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cinema-film-'))
    const listPath = path.join(tmp, 'acts.txt')
    const outPath = path.join(tmp, 'final_film.mp4')

    const localPaths: string[] = []
    for (let i = 0; i < actUrls.length; i++) {
      const p = path.join(tmp, `act_${i + 1}.mp4`)
      const resp = await fetch(actUrls[i])
      const { createWriteStream } = await import('fs')
      const { pipeline } = await import('stream/promises')
      await pipeline(resp.body as any, createWriteStream(p))
      localPaths.push(p)
    }

    const concatContent = localPaths.map(p => `file '${p}'`).join('\n')
    await fs.writeFile(listPath, concatContent)
    execSync(`ffmpeg -y -f concat -safe 0 -i "${listPath}" -c copy "${outPath}"`)

    const { r2 } = await import('../storage/r2')
    const url = await r2.uploadFile(outPath, `films/${title.replace(/\s+/g, '_')}_${Date.now()}.mp4`)
    await fs.rm(tmp, { recursive: true, force: true })
    return url
  }
}

interface ParsedScript {
  title: string
  total_scenes: number
  acts: ParsedAct[]
}

interface ParsedAct { number: number; scenes: ParsedScene[] }
interface ParsedScene {
  number: string
  heading: string
  int_ext: string
  location: string
  time_of_day: string
  action: string
  characters: string[]
  dialogue: Array<{ character: string; parenthetical: string | null; line: string }>
  estimated_duration_seconds: number
}
interface FilmScene { heading: string; actionLines: string; characterIds: string[]; dialogue: any }
interface Shot { shot_id?: string; sequence_index?: number; duration_seconds: number }
```

---

## SYSTEM 7 — SERIES MANAGER

### `src/lib/series/SeriesManager.ts`

```typescript
import { runModel1 } from '../brain/model1'
import { FilmDirector } from '../film/FilmDirector'
import { db } from '../db'

export class SeriesManager {
  private filmDirector = new FilmDirector()

  // ── Generate a Series Bible from a concept ───────────────
  async generateSeriesBible(params: {
    concept: string
    type: string          // 'tv_drama' | 'web_series' | 'social_series' etc
    platform: string
    episodeCount: number
    episodeRuntime: number
  }): Promise<SeriesBible> {
    const response = await runModel1({
      systemPrompt: `You are a TV showrunner and series developer. Create a complete series bible from the given concept.
Return JSON: {
  "premise": string,
  "logline": string,
  "world_building": string,
  "tone_and_style": string,
  "recurring_themes": [string],
  "episode_formula": string,
  "character_archetypes": [{ "name": string, "role": string, "arc": string }],
  "visual_style": string,
  "music_style": string,
  "season_arcs": [{ "season": 1, "arc": string, "themes": [string] }]
}`,
      userMessage: `Concept: ${params.concept}\nType: ${params.type}\nPlatform: ${params.platform}\nEpisode runtime: ${params.episodeRuntime} minutes`,
      requireJSON: true,
      useAgenticLoop: true,
    })
    return JSON.parse(response.content)
  }

  // ── Generate episode breakdown from bible + episode brief ─
  async generateEpisode(params: {
    seriesId: string
    seasonNumber: number
    episodeNumber: number
    episodeBrief: string
    tier: 'Draft' | 'Studio' | 'Blockbuster'
    userId: string
  }): Promise<string> {
    const series = await db.seriesProject.findUnique({ where: { id: params.seriesId } })
    if (!series) throw new Error('Series not found')

    const bible = series.seriesBible as SeriesBible
    const format = series.episodeFormat as EpisodeFormat

    // Generate episode script following the series formula
    const scriptResponse = await runModel1({
      systemPrompt: `You are the showrunner for ${series.title}. Write an episode following the series bible exactly.
Bible: ${JSON.stringify(bible)}
Episode format: ${JSON.stringify(format)}
Return Fountain-format screenplay.`,
      userMessage: `Season ${params.seasonNumber}, Episode ${params.episodeNumber}\nBrief: ${params.episodeBrief}`,
      requireJSON: false,
      useAgenticLoop: true,
    })

    // Parse screenplay and produce
    const parsed = await this.filmDirector.parseFountainScript(scriptResponse.content)

    // Create episode record in DB
    const season = await db.season.findFirst({
      where: { seriesId: params.seriesId, seasonNumber: params.seasonNumber }
    })

    const episode = await db.episode.create({
      data: {
        seasonId: season!.id,
        episodeNumber: params.episodeNumber,
        title: `Episode ${params.episodeNumber}`,
        logline: params.episodeBrief,
        targetRuntime: (series.episodeFormat as any).runtime ?? 22,
        status: 'in_production',
      }
    })

    // Create a temporary film project for this episode and produce it
    const tempFilm = await db.filmProject.create({
      data: {
        userId: params.userId,
        title: `${series.title} S${params.seasonNumber}E${params.episodeNumber}`,
        type: 'FEATURE_FILM',
        targetRuntime: (series.episodeFormat as any).runtime ?? 22,
        status: 'PRODUCTION',
      }
    })

    return this.filmDirector.produceFullFilm({
      filmProjectId: tempFilm.id,
      tier: params.tier,
      userId: params.userId,
    })
  }

  // ── Social series: consistent format per episode ─────────
  async generateSocialEpisode(params: {
    seriesId: string
    episodeNumber: number
    topic: string
    tier: 'Draft' | 'Studio' | 'Blockbuster'
    userId: string
  }): Promise<string> {
    const series = await db.seriesProject.findUnique({ where: { id: params.seriesId } })
    if (!series) throw new Error('Series not found')

    const bible = series.seriesBible as SeriesBible
    const format = series.episodeFormat as EpisodeFormat

    // Generate episode with consistent branding elements (intro, outro, lower thirds)
    const response = await runModel1({
      systemPrompt: `Generate a shot list for a social media series episode. Follow the series format exactly.
Include: series intro (3s), content shots, series outro (3s). Maintain consistent visual brand.
Bible: ${JSON.stringify(bible)}. Return JSON shot array.`,
      userMessage: `Episode ${params.episodeNumber} topic: ${params.topic}`,
      requireJSON: true,
    })

    const shots = JSON.parse(response.content)
    const { SwarmRouter } = await import('../swarm/SwarmRouter')
    const swarm = new SwarmRouter()

    const shotList = await swarm.decompose({
      userInput: shots.map((s: any) => s.description).join('. '),
      tier: params.tier,
      userId: params.userId,
    })

    const results = await swarm.dispatch({
      shotList,
      userId: params.userId,
      projectId: params.seriesId,
    })

    const { SeamlessBlender } = await import('../swarm/SeamlessBlender')
    const blender = new SeamlessBlender()
    return blender.blend({ results, shots: shotList.shots, applyHouseLook: true })
  }
}

interface SeriesBible {
  premise: string; logline: string; world_building: string
  tone_and_style: string; recurring_themes: string[]
  episode_formula: string
  character_archetypes: Array<{ name: string; role: string; arc: string }>
  visual_style: string; music_style: string
  season_arcs: Array<{ season: number; arc: string; themes: string[] }>
}
interface EpisodeFormat { runtime: number; structure: string[] }
```

---

## SYSTEM 8 — REFERENCE VIDEO ANALYSER

### `src/lib/analysis/ReferenceVideoAnalyser.ts`

The AI analyses an uploaded or linked reference video to extract style DNA — cinematography, pacing, colour, narrative structure, audio design — then uses that DNA to assist in writing new scripts, generating matching visual content, or providing a creative brief for a new project.

```typescript
import { runModel1 } from '../brain/model1'
import { fal } from '../fal/client'

export interface VideoStyleDNA {
  // Visual
  cinematography: {
    dominantShotTypes: string[]     // ['close-up', 'wide shot', 'POV']
    cameraMovements: string[]       // ['handheld', 'steady dolly', 'drone aerial']
    averageShotDuration: number     // seconds
    depthOfField: string            // 'shallow', 'deep', 'variable'
    lensCharacter: string           // 'wide angle distortion', 'telephoto compressed', 'normal'
  }
  colourGrade: {
    dominantPalette: string[]       // hex colours
    temperature: string             // 'warm' | 'cool' | 'neutral'
    contrast: string                // 'high contrast' | 'low contrast' | 'flat'
    saturation: string              // 'desaturated' | 'natural' | 'vibrant' | 'hyper-saturated'
    filmEmulation?: string          // 'Kodak', 'Fuji', 'digital clean'
    shadows: string
    highlights: string
  }
  editingStyle: {
    cuttingPattern: string          // 'fast-paced MTV', 'slow burn', 'rhythmic musical'
    averageCutFrequency: number     // cuts per minute
    transitionTypes: string[]
    pacing: string                  // 'frantic', 'deliberate', 'variable'
    matchCuts: boolean
  }
  narrative: {
    structure: string               // '3-act', 'non-linear', 'episodic', 'montage'
    tone: string
    themes: string[]
    storyBeats: string[]
    openingHook: string
    closingStyle: string
  }
  audioProfile: {
    musicStyle: string
    musicPlacement: string          // 'wall-to-wall', 'sparse', 'contrapuntal'
    dialogueStyle: string           // 'naturalistic', 'stylised', 'minimal'
    sfxDensity: string              // 'rich', 'minimal', 'sound design heavy'
    silencePlacement: string        // how silence is used
  }
  productionDesign: {
    settingTypes: string[]
    timeperiod: string
    textureAndMaterials: string
    lightingSources: string[]       // 'practical', 'natural', 'cinematic studio'
  }
  // Synthesised creative brief
  creativeBrief: string
  influencedBy: string[]           // comparable films/directors
  replicationPromptPackage: ReplicationPrompts
}

export interface ReplicationPrompts {
  cinematographyPrompt: string    // inject into generation prompts for matching style
  colourGradeInstruction: string  // for post-processing
  editingInstructions: string     // for timeline assembly
  audioPrompt: string             // for music/foley generation
  overallStyleGuide: string       // comprehensive style injection
}

export class ReferenceVideoAnalyser {

  // ── Main analysis pipeline ───────────────────────────────
  async analyseReference(params: {
    videoUrl: string
    analysisDepth: 'quick' | 'standard' | 'deep'
    extractScriptElements?: boolean  // also extract potential story beats for scripting
  }): Promise<VideoStyleDNA> {

    // Extract frames at regular intervals for visual analysis
    const sampleTimestamps = params.analysisDepth === 'quick' ? [0.1, 0.5, 0.9]
      : params.analysisDepth === 'standard' ? [0.1, 0.25, 0.5, 0.75, 0.9]
      : [0.05, 0.15, 0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95]

    const frames = await Promise.all(
      sampleTimestamps.map(ts =>
        fal.run('fal-ai/video-frame-extractor', {
          video_url: params.videoUrl,
          timestamp: ts,
        }).then(r => (r as { image_url: string }).image_url)
      )
    )

    // Run comprehensive visual analysis on all frames simultaneously
    const visualAnalysis = await runModel1({
      systemPrompt: `You are a professional cinematographer and film analyst. Analyse these frames from a reference video and extract the complete visual style DNA.

Be specific and technical. Avoid vague descriptions. Your analysis will be used to:
1. Guide generation model prompts to match this style
2. Configure colour grading settings
3. Inform editing rhythm and shot selection

Return ONLY this JSON structure:
{
  "cinematography": {
    "dominantShotTypes": [],
    "cameraMovements": [],
    "averageShotDuration": 0,
    "depthOfField": "",
    "lensCharacter": ""
  },
  "colourGrade": {
    "dominantPalette": ["#hex"],
    "temperature": "",
    "contrast": "",
    "saturation": "",
    "filmEmulation": "",
    "shadows": "",
    "highlights": ""
  },
  "editingStyle": {
    "cuttingPattern": "",
    "averageCutFrequency": 0,
    "transitionTypes": [],
    "pacing": "",
    "matchCuts": false
  },
  "narrative": {
    "structure": "",
    "tone": "",
    "themes": [],
    "storyBeats": [],
    "openingHook": "",
    "closingStyle": ""
  },
  "audioProfile": {
    "musicStyle": "",
    "musicPlacement": "",
    "dialogueStyle": "",
    "sfxDensity": "",
    "silencePlacement": ""
  },
  "productionDesign": {
    "settingTypes": [],
    "timeperiod": "",
    "textureAndMaterials": "",
    "lightingSources": []
  },
  "influencedBy": []
}`,
      userMessage: 'Analyse these video frames for complete style DNA extraction.',
      images: frames,
      requireJSON: true,
      useAgenticLoop: params.analysisDepth === 'deep',
    })

    const analysis = JSON.parse(visualAnalysis.content)

    // Synthesise creative brief and replication prompts
    const synthesisResponse = await runModel1({
      systemPrompt: `You are a creative director. Based on this style analysis, write:
1. A one-paragraph creative brief capturing the essence of this visual language
2. Injection prompts for an AI generation system to replicate this style

Return JSON: {
  "creativeBrief": "string",
  "replicationPrompts": {
    "cinematographyPrompt": "string for injecting into video generation prompts",
    "colourGradeInstruction": "string for post-processing configuration",
    "editingInstructions": "string for timeline assembly",
    "audioPrompt": "string for music and foley generation",
    "overallStyleGuide": "comprehensive style injection string"
  }
}`,
      userMessage: `Style analysis: ${JSON.stringify(analysis)}`,
      requireJSON: true,
    })

    const synthesis = JSON.parse(synthesisResponse.content)

    return {
      ...analysis,
      creativeBrief: synthesis.creativeBrief,
      replicationPrompts: synthesis.replicationPrompts,
    }
  }

  // ── Generate new script inspired by reference style ──────
  async generateScriptFromReference(params: {
    referenceVideoUrl: string
    newConcept: string
    format: 'feature_film' | 'short_film' | 'episode' | 'social'
    targetRuntime: number
  }): Promise<string> {
    const styleDNA = await this.analyseReference({
      videoUrl: params.referenceVideoUrl,
      analysisDepth: 'standard',
      extractScriptElements: true,
    })

    const scriptResponse = await runModel1({
      systemPrompt: `You are a screenwriter. Write a ${params.format} screenplay inspired by the reference style.
Adopt the narrative structure, tone, and storytelling approach of the reference.
Reference style: ${styleDNA.creativeBrief}
Narrative structure: ${styleDNA.narrative.structure}
Tone: ${styleDNA.narrative.tone}
Themes drawn from reference: ${styleDNA.narrative.themes.join(', ')}

Write in Fountain screenplay format. Target runtime: ${params.targetRuntime} minutes.`,
      userMessage: `New concept: ${params.newConcept}`,
      requireJSON: false,
      useAgenticLoop: true,
    })

    return scriptResponse.content
  }

  // ── Match generation style to reference ─────────────────
  // Injects the reference video's visual style into a shot list
  // so all generated shots adopt the reference aesthetic.
  async applyStyleDNAToShotList(
    shots: any[],
    styleDNA: VideoStyleDNA
  ): Promise<any[]> {
    const styleInjection = styleDNA.replicationPrompts.cinematographyPrompt
    const colourInjection = styleDNA.replicationPrompts.colourGradeInstruction

    return shots.map(shot => ({
      ...shot,
      prompt_enhanced: shot.prompt_enhanced
        ? `${shot.prompt_enhanced}\n\nStyle reference: ${styleInjection}`
        : styleInjection,
      colourGradeInstruction: colourInjection,
      averageShotDuration: styleDNA.editingStyle.averageShotDuration,
    }))
  }
}
```

---

## API ROUTES — NEW ENDPOINTS

### `src/app/api/film/create/route.ts`
```typescript
// POST { title, type, logline, synopsis, genre, targetRuntime }
// Creates FilmProject, returns project ID and empty structure
```

### `src/app/api/film/[id]/produce/route.ts`
```typescript
// POST { actId?, tier }
// If actId: produce that act only
// If no actId: produce entire film
// Returns SSE stream with per-scene progress
```

### `src/app/api/series/create/route.ts`
```typescript
// POST { title, type, platform, concept, episodeRuntime }
// Generates series bible + creates SeriesProject
// Returns series bible JSON for user review/edit before committing
```

### `src/app/api/series/[id]/episode/route.ts`
```typescript
// POST { seasonNumber, episodeNumber, episodeBrief, tier }
// Generates and produces a single episode
// Returns SSE stream with progress
```

### `src/app/api/casting/recast/route.ts`
```typescript
// POST { projectId, originalCharacterId, replacementCharacterId, scope, applyToAllClips }
// Queues recast jobs for all affected clips
// Returns { updatedClips, estimatedCredits, jobIds }
```

### `src/app/api/makeup/apply/route.ts`
```typescript
// POST { videoUrl, effects, intensity } or { videoUrl, naturalLanguageRequest }
// Returns { videoUrl, appliedEffects }
```

### `src/app/api/greenscreen/composite/route.ts`
```typescript
// POST { sourceVideoUrl, extractionMode, backdrop }
// Returns { composited_url, preview_frame }
```

### `src/app/api/analysis/reference/route.ts`
```typescript
// POST { videoUrl, analysisDepth, generateScript?, newConcept?, format? }
// Returns { styleDNA, script? }
```

### `src/app/api/analysis/match-style/route.ts`
```typescript
// POST { referenceVideoUrl, targetShotListId }
// Applies reference style DNA to an existing shot list
// Returns updated shot list with style injections
```

---

## CREDIT COSTS — ADD TO OPERATION_COSTS

```typescript
// Casting & characters
multi_character_cast_2:    5,    // per 5s clip with 2 characters
multi_character_cast_3_5:  8,    // per 5s clip with 3-5 characters
multi_character_cast_6plus: 12,  // per 5s clip with 6+ characters

// Makeup FX
makeup_sfx_pregeneration:  0,    // free — baked into generation cost
makeup_sfx_postgeneration: 4,    // per clip, post-process application
makeup_reference_transfer: 5,    // per clip, reference-based transfer
makeup_progression_set:    15,   // generate full damage progression (5 states)

// Green screen & compositing
greenscreen_chroma_key:    3,    // FFmpeg chroma key per clip
greenscreen_ai_matting:    6,    // BiRefNet AI matting per clip
backdrop_ai_generate:      10,   // generate new AI backdrop
backdrop_composite:        4,    // composite FG over existing backdrop

// Recasting
recast_face_swap:          8,    // per clip face swap
recast_full_character:     15,   // per clip full character replacement
recast_project_wide:       50,   // base cost + per-clip costs for whole project

// Film production
film_scene_production:     20,   // base per scene (+ shot generation costs)
film_act_assembly:         10,   // assemble act from generated scenes
film_full_production:      100,  // base full film orchestration fee

// Series
series_bible_generation:   15,   // generate complete series bible
episode_production:        50,   // base per episode (+ scene costs)
social_episode:            20,   // short-form social series episode

// Reference analysis
reference_quick_analysis:  5,
reference_deep_analysis:   15,
reference_script_generate: 20,
reference_style_apply:     8,
```

---

## SPRINT ADDITIONS — ADD TO BUILD ORDER

**Sprint 31 — Casting & Makeup System:**
1. Implement `CastMember` Prisma model and migrations
2. Build `CastManager.ts` — multi-character payload builder, makeup prompt compiler
3. Build `SFXMakeupEngine.ts` — all 4 modes (pre-gen, post-gen, transfer, progression)
4. Build `/api/makeup/apply` endpoint
5. Build Makeup FX panel UI in Ultimate mode — full effect browser with body location picker
6. Test: apply blood + bruising + ash to a generated character clip

**Sprint 32 — Green Screen System:**
1. Build `GreenScreenEngine.ts` — all 3 extraction modes + backdrop resolution + composite
2. Build `/api/greenscreen/composite` endpoint
3. Build Green Screen mode UI panel — extraction mode picker, backdrop source selector
4. Add background swap to clip right-click context menu in timeline
5. Test: AI matting on a character clip, composite over Cesium aerial backdrop

**Sprint 33 — Character Recasting:**
1. Build `Recaster.ts` — face swap, full character, silhouette, project-wide
2. Build `/api/casting/recast` endpoint
3. Add "Recast" option to character vault card UI
4. Build recast scope selector UI (face only / full character / project-wide)
5. Test: recast a character in 3 clips and verify consistency

**Sprint 34 — Film Mode:**
1. Create all FilmProject Prisma models + migrations
2. Build `FilmDirector.ts` — Fountain parser, shot list generator, act producer
3. Build `/api/film/*` endpoints
4. Build Film Mode UI in Ultimate — project overview, act/scene tree, screenplay editor
5. Test: parse a 5-page Fountain script, generate shot list, produce 2-minute act

**Sprint 35 — Series Mode:**
1. Create Series/Season/Episode Prisma models + migrations
2. Build `SeriesManager.ts` — bible generator, episode producer, social episode
3. Build `/api/series/*` endpoints
4. Build Series Manager UI — series overview, episode grid, season planning
5. Test: generate series bible from concept, produce 2-minute pilot episode

**Sprint 36 — Reference Video Analysis:**
1. Build `ReferenceVideoAnalyser.ts` — full pipeline with frame analysis
2. Build `/api/analysis/reference` and `/api/analysis/match-style` endpoints
3. Build Reference Upload panel UI — video upload, analysis depth selector, DNA display
4. Wire style DNA injection into shot list decompose flow
5. Test: analyse 30s reference clip, generate matching 30s new content
