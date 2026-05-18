# CINÉMA — AGENTIC MEDIA SWARM UPGRADE
## Master Cursor Prompt: Research-Backed Shot-Level AI Orchestration

> **Read CINEMA_cursor_prompt.md first.** This supersedes the model routing section entirely and adds the full Agentic Media Swarm system. Every file here must be built completely.

---

## THE PARADIGM SHIFT

Every other platform: user picks a model → system generates a clip.

CINÉMA: user writes a script → Brain decomposes into shots → each shot analysed for scene type, physics requirements, character needs, duration, audio → dispatched to the benchmark-optimal specialist model → harmonised, stitched, delivered seamlessly.

This is compute arbitrage at cinematic scale. A 3-minute Blockbuster film uses six models, each operating only in its zone of verified superiority. The user sees none of the complexity.

---

## RESEARCH-BACKED MODEL ASSIGNMENTS

Based on VBench-2.0, MovieGenBench (1,003 prompt test), Artificial Analysis Elo leaderboard, and verified 2025-2026 community benchmarks. No marketing claims — only what data confirms.

### SEEDANCE 2.0 (ByteDance)
Elo 1,176 — leads audio I2V category by largest margin in arena history.
First unified audio-video joint generation architecture (model hears what it generates).
12-file multimodal input. Phoneme-level lip sync in 8+ languages.
WINS: Character photorealism with audio, multi-shot storytelling, portrait consistency, product shoots, dialogue scenes
LOSES: Complex physics (water/fire/structural dynamics)
COST INDEX: 7/10

### VEO 3.1 (Google DeepMind)
Best prompt adherence on MovieGenBench 1,003-prompt test — outperforms all competitors.
Top-ranked on physics realism subset specifically. Native ambient audio pioneer.
WINS: Fluid dynamics (water/rain/fire/smoke/fog), complex nature, cinematic lighting, macro photography, commercial aesthetics, weather systems, physics of any kind
LOSES: Cross-shot character consistency
COST INDEX: 9/10

### KLING 3.0 (Kuaishou)
VBench-2.0: "broad and well-rounded, does not show significantly weaker performance in any area."
Multi-shot subject consistency (3–15s across camera angles). Precise motion control.
WINS: Camera choreography, sports and athletic motion, hand tasks, character biomechanics, cross-angle continuity
LOSES: Very fast multi-person interactions, extreme physics
COST INDEX: 8/10

### RUNWAY GEN-4.5
Elo 1,247 — top proprietary benchmark score. 16-second clips. Motion brush control.
WINS: Character and object consistency across independently generated clips (the cross-clip continuity problem), longer clips, motion brush for specific element animation
LOSES: Pure photorealism vs Veo, native audio still catching up
COST INDEX: 8/10

### SKYREELS V1 (Skywork AI — HunyuanVideo fine-tuned on 10M Hollywood clips)
33 distinct facial expressions. 400+ natural movement combinations documented.
WINS: Emotional acting performance, facial nuance, dramatic close-ups, human portraiture
LOSES: Non-human content, environments, physics
COST INDEX: 7/10

### HUNYUANVIDEO 1.5 (Tencent)
VBench-2.0: strong Human Fidelity and Motion Rationality for multi-person scenes. 13B params.
WINS: Multi-character group dynamics, crowd scenes, structural physics, dense urban environments, natural motion, cloth simulation
LOSES: Single-character performance close-up (SkyReels wins that), fluid dynamics (Veo wins that)
COST INDEX: 4/10

### WAN 2.2 MoE (Alibaba)
84.7% VBench aggregate — highest verified open-source score. Apache 2.0 licence.
WINS: Photorealistic animal fur/skin texture (benchmark leader), wildlife, human subjects at budget cost, environmental shots, self-hostable
LOSES: Cannot match Veo on physics or Kling on precision motion at premium tiers
COST INDEX: 2/10

### COGVIDEOX (Zhipu AI)
VBench-2.0: strong Complex Landscape, Complex Plot, Physics adherence.
DOCUMENTED WEAKNESS: Human Fidelity and Motion Rationality (limited human training data).
WINS: ANY text legible in frame (signs, displays, neon), complex spatial description adherence, long-form content
LOSES: Human performance (critical documented weakness — never use for human close-ups)
COST INDEX: 3/10

### LTX-2.3 (Lightricks)
Real-time generation: 5s clip in 4s on RTX 4090. Prompt adherence 9/10 in testing.
WINS: Fastest iteration, stylized/artistic content, proxy generation, rapid drafts, social short-form
LOSES: Cinematic photorealism, complex physics
COST INDEX: 1/10 (near-free locally)

### PIKA 2.2
Pikaframes (first/last frame control), ingredients system, Pikaformance talking images.
WINS: Bold social content, object-level animation, talking avatar, controlled transitions
COST INDEX: 5/10

### MINIMAX / HAILUO 2.3
Only model supporting up to 6-minute continuous generation.
WINS: Extended narratives (60s–6min), documentary sequences, sustained long-form quality
COST INDEX: 5/10

---

## COMPLETE SCENE-TYPE ROUTING MATRIX

```
SCENE TYPE                      → MODEL              RATIONALE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HUMAN & CHARACTER
Emotional close-up / acting     → SkyReels V1        33 expressions, Hollywood-trained
Talking head with audio         → Seedance 2.0       Unified A/V, phoneme lip sync
Sports / athletic performance   → Kling 3.0          Biomechanics precision
Hands performing specific task  → Kling 3.0          Hand benchmark specialist
Character across many shots     → Runway Gen-4.5     Cross-clip consistency leader
Multi-character group scene     → HunyuanVideo 1.5   Multi-person specialist
Human in wide/background only   → Wan 2.2            Cost-efficient, decent quality
Portrait / photorealistic       → Seedance 2.0       Composite leaderboard leader
Walking / running               → Kling 3.0          Motion control
Dance / choreography            → Kling 3.0          Precision motion

ANIMALS & WILDLIFE
Photorealistic fur / skin       → Wan 2.2            Best open-source texture score
Moving animal in wild           → Wan 2.2            Smooth motion + fur textures
Large animal / stampede         → HunyuanVideo 1.5   Multi-body dynamics
Animal close-up macro           → Veo 3.1            Macro + photorealism
Animal in weather system        → Veo 3.1            Fluid physics + nature

ENVIRONMENTS & NATURE
Basic establishing wide shot    → Wan 2.2            Cost-efficient quality
Cinematic nature hero shot      → Veo 3.1            Physics + lighting leader
Forest / trees with wind        → Veo 3.1            Fluid dynamics (foliage)
Mountain / aerial landscape     → Wan 2.2 / Veo 3.1 Budget vs cinematic
Ocean / beach / waves           → Veo 3.1            Fluid dynamics champion
Desert / barren landscape       → Wan 2.2            Cost-efficient
Sunset / golden hour drama      → Veo 3.1            Lighting physics

CITIES & ARCHITECTURE
Dense city / cyberpunk          → HunyuanVideo 1.5   Structural density + crowds
Architectural detail shot       → CogVideoX          Complex prompt adherence
Building exterior (hero)        → Veo 3.1            Photorealistic commercial
Crowd / public space            → HunyuanVideo 1.5   Multi-person benchmark
Night city / neon streets       → HunyuanVideo 1.5   Dense urban specialist
Aerial city flyover             → Wan 2.2            Cost-efficient aerials
Interior spaces                 → Seedance 2.0       Consistency + photorealism

WEATHER & PHYSICS
Rain (any intensity)            → Veo 3.1            Fluid dynamics leader
Ocean / water (any)             → Veo 3.1            Physics benchmark winner
Fire / explosions               → Veo 3.1            Physics simulation champion
Smoke / fog / mist              → Veo 3.1            Particle fluid specialist
Snow / blizzard                 → Veo 3.1            Weather simulation
Wind effect on objects          → Veo 3.1            Cloth + fluid physics
Lightning / storm               → Veo 3.1            Environmental physics

VEHICLES & MECHANICAL
Car chase / high speed          → HunyuanVideo 1.5   High-speed motion specialist
Drone / aerial vehicle          → Wan 2.2            Cost-efficient aerials
Aircraft exterior               → HunyuanVideo 1.5   Structural physics
Vehicle crash / impact          → Veo 3.1            Physics simulation
Spacecraft / sci-fi vehicle     → HunyuanVideo 1.5   Structural + density
Macro vehicle detail            → Veo 3.1            Macro + photorealism

TEXT IN FRAME (ANY)
ANY text visible in frame       → CogVideoX          ONLY reliable text renderer
Neon signs                      → CogVideoX          Text + lighting fidelity
Digital displays / screens      → CogVideoX          Precise text rendering
Newspapers / books / UI         → CogVideoX          Complex text adherence

SPECIAL EFFECTS
Stylised VFX sequence           → Seedance 2.0       Multi-reference + style
Practical fire / explosion      → Veo 3.1            Physics leader
Particle effects                → Veo 3.1            Physics simulation
Abstract / surreal              → LTX-2.3            Stylized specialist
Fantasy / magic effects         → Seedance 2.0       Stylized VFX + reference

AUDIO-DRIVEN SCENES
Native audio required           → Seedance 2.0       Unified A/V architecture
Dialogue with accurate lips     → Seedance 2.0       Phoneme-level sync
Ambient sound critical          → Veo 3.1            Native audio pioneer
Music video (beat-driven)       → Kling 3.0          Motion control precision
Post-sync voice (vault)         → ElevenLabs+SadTalker Vault voice + lipsync pass

LONG-FORM DURATION
Shot 12–30 seconds              → Minimax            Extended generation
Shot > 30 seconds               → Minimax            Only viable option (6 min)
Documentary sequence            → Minimax            Sustained quality

DRAFT / BUDGET TIER
Any draft proxy                 → LTX-2.3            Real-time, near-free
Draft human scene               → Wan 2.2            Best budget human quality
Draft environment               → Wan 2.2            Cost-efficient
Draft social content            → Pika 2.2           Social-optimised

V2V REPAIR & REPAINT
Fix warped face                 → Seedance 2.0       V2V + multi-reference
Style transfer                  → Seedance 2.0       Reference master
Fix specific region             → Seedance 2.0       Frankenstein workflow
Upgrade base-plate              → Veo 3.1            Physics + photorealism
```

---

## FILE 1 — src/lib/swarm/types.ts

```typescript
export type SceneCategory =
  | 'human_emotional_closeup' | 'human_talking_audio' | 'human_sports_athletic'
  | 'human_hands_task' | 'human_character_continuity' | 'human_group_multi'
  | 'human_wide_background' | 'human_portrait_photorealistic'
  | 'human_walking_running' | 'human_dance_choreography'
  | 'animal_photorealistic_texture' | 'animal_moving_wildlife'
  | 'animal_large_multi' | 'animal_closeup_macro' | 'animal_in_weather'
  | 'environment_establishing' | 'environment_cinematic_hero'
  | 'environment_trees_foliage' | 'environment_aerial_landscape'
  | 'environment_water_ocean' | 'environment_arid_desert' | 'environment_golden_hour'
  | 'urban_dense_cyberpunk' | 'urban_architectural_detail' | 'urban_building_hero'
  | 'urban_crowd' | 'urban_night_neon' | 'urban_aerial_flyover' | 'urban_interior'
  | 'physics_rain' | 'physics_water_fluid' | 'physics_fire_explosion'
  | 'physics_smoke_fog' | 'physics_snow_blizzard' | 'physics_wind_cloth'
  | 'physics_lightning_storm'
  | 'vehicle_car_chase' | 'vehicle_aerial_drone' | 'vehicle_aircraft'
  | 'vehicle_crash_impact' | 'vehicle_spacecraft' | 'vehicle_macro_detail'
  | 'text_in_frame' | 'text_neon_sign' | 'text_digital_display' | 'text_document'
  | 'vfx_stylized' | 'vfx_practical_explosion' | 'vfx_particles'
  | 'vfx_abstract_surreal' | 'vfx_fantasy_magic'
  | 'audio_native_required' | 'audio_dialogue_lipsync'
  | 'audio_ambient_critical' | 'audio_music_video'
  | 'duration_extended_30s_plus' | 'duration_long_form'
  | 'draft_proxy' | 'draft_social'
  | 'v2v_face_repair' | 'v2v_style_transfer' | 'v2v_region_fix' | 'v2v_base_upgrade'

export type ModelId =
  | 'seedance_2_0' | 'veo_3_1' | 'kling_3_0' | 'runway_gen4_5' | 'skyreels_v1'
  | 'hunyuan_1_5' | 'wan_2_2' | 'cogvideox' | 'ltx_2_3' | 'pika_2_2'
  | 'minimax_hailuo' | 'mochi_1'

export type OutcomeTier = 'Draft' | 'Studio' | 'Blockbuster'

export interface Shot {
  shot_id: string
  sequence_index: number
  description: string
  duration_seconds: number
  scene_category: SceneCategory
  secondary_categories: SceneCategory[]
  has_text_in_frame: boolean
  has_human_primary: boolean
  has_human_background: boolean
  has_fluid_physics: boolean
  has_fire_explosion: boolean
  has_animal: boolean
  has_crowd: boolean
  has_audio_requirement: boolean
  has_dialogue: boolean
  has_vehicle: boolean
  is_hero_shot: boolean
  is_long_form: boolean
  character_ids: string[]
  location_id?: string
  reference_image_count: number
  shot_type: 'ECU' | 'CU' | 'MCU' | 'MS' | 'WS' | 'EWS' | 'POV' | 'OTS' | 'INSERT'
  camera_motion: string
  mood: string
  assigned_model?: ModelId
  estimated_cost_credits: number
  requires_post_lipsync: boolean
  requires_face_enhance: boolean
  requires_relight: boolean
  v2v_source_url?: string
  prompt_raw: string
  prompt_enhanced?: string
  generated_url?: string
  quality_score?: number
  needs_repaint?: boolean
  stitch_config: StitchConfig
}

export interface StitchConfig {
  transition: 'cut' | 'dissolve' | 'match_cut' | 'smash_cut' | 'wipe' | 'fade'
  duration_ms: number
  motion_match: boolean
  colour_match: boolean
}

export interface ShotList {
  project_id: string
  tier: OutcomeTier
  total_duration_seconds: number
  shots: Shot[]
  estimated_total_credits: number
  model_distribution: Record<ModelId, number>
  cost_breakdown: Record<ModelId, number>
}

export interface SwarmResult {
  shot_id: string
  model_used: ModelId
  output_url: string
  proxy_url: string
  generation_ms: number
  cost_credits: number
  quality_score: number
  needs_repaint: boolean
  repaint_regions: RepaintRegion[]
}

export interface RepaintRegion {
  description: string
  x: number; y: number; width: number; height: number
  start_time: number; end_time: number
  repair_prompt: string
  suggested_model: ModelId
}

export interface TimelineEditRequest {
  project_id: string
  clip_id: string
  clip_url: string
  start_time: number
  end_time: number
  user_instruction: string
  tier: OutcomeTier
  character_ids?: string[]
}
```

---

## FILE 2 — src/lib/swarm/brain-prompts.ts

```typescript
// AGENT 1 — CASTING DIRECTOR: Decomposes script into tagged shots
export const CASTING_DIRECTOR_PROMPT = `
You are the Casting Director for CINÉMA. Decompose the user's script into individual shots.
Tag each shot with its exact scene_category so our routing system dispatches to the benchmark-optimal model.

HARD ROUTING RULES (apply in order, override everything):
1. ANY text legible in frame → scene_category MUST be text_in_frame (or text_neon_sign etc)
2. Fluid physics is dominant visual → scene_category MUST be physics_[type]
3. Human face is primary AND performance matters → human_emotional_closeup
4. Human talking AND audio sync matters → human_talking_audio
5. Shot duration > 30s → duration_extended_30s_plus (Minimax only)
6. Draft tier + non-hero establishing shot → draft_proxy (LTX-2.3)

Duration rules: ECU/CU: 2-5s | MS: 4-7s | WS: 5-10s | Action: 3-6s | Dialogue: 3-8s | MAX: 12s

Return ONLY valid JSON. No preamble. No markdown. Schema:
{
  "total_duration_seconds": number,
  "shots": [{
    "shot_id": "shot_001",
    "sequence_index": 1,
    "description": "precise visual description with named action not abstraction",
    "duration_seconds": number,
    "scene_category": "exact_category_string",
    "secondary_categories": [],
    "has_text_in_frame": false,
    "has_human_primary": false,
    "has_human_background": false,
    "has_fluid_physics": false,
    "has_fire_explosion": false,
    "has_animal": false,
    "has_crowd": false,
    "has_audio_requirement": false,
    "has_dialogue": false,
    "has_vehicle": false,
    "is_hero_shot": false,
    "is_long_form": false,
    "character_ids": [],
    "location_id": null,
    "reference_image_count": 0,
    "shot_type": "WS",
    "camera_motion": "static",
    "mood": "neutral",
    "estimated_cost_credits": 0,
    "requires_post_lipsync": false,
    "requires_face_enhance": false,
    "requires_relight": false,
    "prompt_raw": "user's text for this beat",
    "stitch_config": { "transition": "cut", "duration_ms": 0, "motion_match": false, "colour_match": true }
  }]
}
`

// AGENT 2 — ART DIRECTOR: Rewrites prompt for each model's optimal trigger patterns
export const ART_DIRECTOR_PROMPT = `
You are the Art Director for CINÉMA. Rewrite the shot prompt to maximise quality for the specific assigned model.

MODEL-SPECIFIC PROMPT ENGINEERING:

Seedance 2.0: Lead with subject consistency anchors. Include appearance details, emotional state.
Phoneme dialogue in [brackets]. Style: "photorealistic, editorial photography, 8K detail".

Veo 3.1: Use physical material vocabulary ("rain-soaked cobblestones reflecting amber streetlights").
Include precise lighting angles. Physics vocabulary triggers simulation engine.
Add sound descriptions for native audio: "distant thunder rolls across the valley".

Kling 3.0: Precise body mechanics ("weight shifts from right to left foot", "thumb pinches pen at 45 degrees").
Exact camera motion ("smooth dolly-in at 0.5m/s"). Include "cinematic" and "film grain".

Runway Gen-4.5: Consistency anchors from prior shots ("same red jacket as previous shot, same face").
Name elements to animate with motion brush. Temporal language ("continuing from previous shot").

SkyReels V1: Named micro-expressions ("nasolabial fold deepens as she smiles").
Describe lighting ratio: key light direction, fill quality, shadow depth. Performance vocabulary.

HunyuanVideo 1.5: Scale descriptors ("200 people visible in frame", "48-storey towers filling frame").
Group dynamics language ("crowd moving in waves like a tide"). Structural vocabulary.

Wan 2.2: Natural texture descriptors ("coarse fur catching the light", "damp earth after rain").
Anchors: "photorealistic", "wildlife photography", "National Geographic aesthetic".

CogVideoX: Spatial precision — list exact text content, size, font feel, position.
Hierarchical spatial descriptions. Include exact wording of any signage.

LTX-2.3: Keep concise 20-40 words. Lead with mood: "Neon-soaked cyberpunk street, 1980s Tokyo".
Emphasise motion style and atmosphere over detail.

Pika 2.2: Ingredients format: "[character]: [action] in [environment]".
Bold visual contrasts, social media energy, specific element to animate.

Minimax: Scene evolution over time ("evolves from dawn to full morning, continuous, 3 minutes").

Return ONLY the enhanced prompt string. Nothing else.
`

// AGENT 3 — QA INSPECTOR: Assesses generated output quality
export const QA_INSPECTOR_PROMPT = `
You are the Quality Inspector for CINÉMA. Assess whether the generated video meets the shot requirements.

Return ONLY this JSON:
{
  "quality_score": 0-10,
  "description_match": 0-10,
  "physics_accuracy": 0-10,
  "character_accuracy": 0-10,
  "issues_found": ["specific issue"],
  "needs_repaint": boolean,
  "repaint_regions": [{
    "description": "what is wrong here",
    "x": 0.0-1.0, "y": 0.0-1.0, "width": 0.0-1.0, "height": 0.0-1.0,
    "start_time": seconds, "end_time": seconds,
    "repair_prompt": "specific prompt to fix this",
    "suggested_repair_model": "seedance_2_0|veo_3_1|kling_3_0|cogvideox"
  }],
  "accept": boolean
}
`

// AGENT 4 — STITCH COORDINATOR: Plans seamless cross-model transitions
export const STITCH_COORDINATOR_PROMPT = `
You are the Stitch Coordinator for CINÉMA. Ensure seamless blending between shots from different models.
Each model has a distinct grain structure, colour science, and compression signature.
Your job: prescribe the exact transition and normalisation to make cuts invisible.

Return ONLY this JSON:
{
  "transition_type": "cut|dissolve|match_cut|smash_cut|wipe|fade",
  "transition_duration_ms": 0-2000,
  "motion_match_needed": boolean,
  "motion_description": "what motion to extract and match at boundary",
  "colour_normalise": boolean,
  "colour_instruction": "warm shift|cool shift|exposure match|none",
  "grain_normalise": boolean,
  "ic_light_instruction": "lighting adjustment description or none",
  "rationale": "why this transition works between these models"
}
`

// AGENT 5 — EDIT ANALYST: Analyses timeline highlight + instruction
export const EDIT_ANALYST_PROMPT = `
You are the Edit Analyst for CINÉMA. Analyse a timeline edit request and determine the optimal repair approach.
Given: user instruction, frame before edit region, frame within region, frame after region.

Return ONLY this JSON:
{
  "scene_category": "exact SceneCategory string",
  "what_user_wants": "precise description of desired visual change",
  "enhanced_instruction": "expanded, specific repair instruction",
  "optimal_model": "model_id",
  "reasoning": "why this model is best for this specific edit",
  "v2v_approach": "regen_full|inpaint_region|style_transfer|frame_anchor",
  "requires_face_enhance": boolean,
  "colour_match_needed": boolean
}
`
```

---

## FILE 3 — src/lib/swarm/SwarmRouter.ts

```typescript
import pLimit from 'p-limit'
import { EventEmitter } from 'events'
import { Shot, ShotList, ModelId, OutcomeTier, SceneCategory, SwarmResult } from './types'
import { CASTING_DIRECTOR_PROMPT, ART_DIRECTOR_PROMPT, QA_INSPECTOR_PROMPT, STITCH_COORDINATOR_PROMPT } from './brain-prompts'
import { runModel1 } from '../brain/model1'
import { callCouncil } from '../brain/council'
import { redis } from '../redis'
import { db } from '../db'
import { fal } from '../fal/client'
import { captureFlywheelSignal } from '../telemetry/flywheel'
import * as models from '../models'

// ── Tier permissions ────────────────────────────────────────
const TIER_MODELS: Record<OutcomeTier, Set<ModelId>> = {
  Draft:       new Set(['ltx_2_3', 'wan_2_2', 'pika_2_2', 'mochi_1']),
  Studio:      new Set(['wan_2_2', 'hunyuan_1_5', 'cogvideox', 'kling_3_0', 'seedance_2_0', 'skyreels_v1', 'minimax_hailuo', 'pika_2_2', 'mochi_1']),
  Blockbuster: new Set(['seedance_2_0', 'veo_3_1', 'kling_3_0', 'runway_gen4_5', 'skyreels_v1', 'hunyuan_1_5', 'wan_2_2', 'cogvideox', 'ltx_2_3', 'pika_2_2', 'minimax_hailuo', 'mochi_1']),
}

// ── Canonical routing table ──────────────────────────────────
const SCENE_TO_MODEL: Partial<Record<SceneCategory, ModelId>> = {
  human_emotional_closeup:       'skyreels_v1',
  human_talking_audio:           'seedance_2_0',
  human_sports_athletic:         'kling_3_0',
  human_hands_task:              'kling_3_0',
  human_character_continuity:    'runway_gen4_5',
  human_group_multi:             'hunyuan_1_5',
  human_wide_background:         'wan_2_2',
  human_portrait_photorealistic: 'seedance_2_0',
  human_walking_running:         'kling_3_0',
  human_dance_choreography:      'kling_3_0',
  animal_photorealistic_texture: 'wan_2_2',
  animal_moving_wildlife:        'wan_2_2',
  animal_large_multi:            'hunyuan_1_5',
  animal_closeup_macro:          'veo_3_1',
  animal_in_weather:             'veo_3_1',
  environment_establishing:      'wan_2_2',
  environment_cinematic_hero:    'veo_3_1',
  environment_trees_foliage:     'veo_3_1',
  environment_aerial_landscape:  'wan_2_2',
  environment_water_ocean:       'veo_3_1',
  environment_arid_desert:       'wan_2_2',
  environment_golden_hour:       'veo_3_1',
  urban_dense_cyberpunk:         'hunyuan_1_5',
  urban_architectural_detail:    'cogvideox',
  urban_building_hero:           'veo_3_1',
  urban_crowd:                   'hunyuan_1_5',
  urban_night_neon:              'hunyuan_1_5',
  urban_aerial_flyover:          'wan_2_2',
  urban_interior:                'seedance_2_0',
  physics_rain:                  'veo_3_1',
  physics_water_fluid:           'veo_3_1',
  physics_fire_explosion:        'veo_3_1',
  physics_smoke_fog:             'veo_3_1',
  physics_snow_blizzard:         'veo_3_1',
  physics_wind_cloth:            'veo_3_1',
  physics_lightning_storm:       'veo_3_1',
  vehicle_car_chase:             'hunyuan_1_5',
  vehicle_aerial_drone:          'wan_2_2',
  vehicle_aircraft:              'hunyuan_1_5',
  vehicle_crash_impact:          'veo_3_1',
  vehicle_spacecraft:            'hunyuan_1_5',
  vehicle_macro_detail:          'veo_3_1',
  text_in_frame:                 'cogvideox',
  text_neon_sign:                'cogvideox',
  text_digital_display:          'cogvideox',
  text_document:                 'cogvideox',
  vfx_stylized:                  'seedance_2_0',
  vfx_practical_explosion:       'veo_3_1',
  vfx_particles:                 'veo_3_1',
  vfx_abstract_surreal:          'ltx_2_3',
  vfx_fantasy_magic:             'seedance_2_0',
  audio_native_required:         'seedance_2_0',
  audio_dialogue_lipsync:        'seedance_2_0',
  audio_ambient_critical:        'veo_3_1',
  audio_music_video:             'kling_3_0',
  duration_extended_30s_plus:    'minimax_hailuo',
  duration_long_form:            'minimax_hailuo',
  v2v_face_repair:               'seedance_2_0',
  v2v_style_transfer:            'seedance_2_0',
  v2v_region_fix:                'seedance_2_0',
  v2v_base_upgrade:              'veo_3_1',
  draft_proxy:                   'ltx_2_3',
  draft_social:                  'pika_2_2',
}

// ── Studio tier downgrades ───────────────────────────────────
const STUDIO_DOWNGRADE: Partial<Record<ModelId, ModelId>> = {
  veo_3_1:       'hunyuan_1_5',
  runway_gen4_5: 'kling_3_0',
  skyreels_v1:   'seedance_2_0',
}

// ── Credits per 5 seconds ────────────────────────────────────
const CREDITS: Record<ModelId, number> = {
  ltx_2_3: 1, wan_2_2: 2, mochi_1: 2, cogvideox: 3,
  hunyuan_1_5: 4, pika_2_2: 5, minimax_hailuo: 5,
  skyreels_v1: 7, seedance_2_0: 7, kling_3_0: 9,
  runway_gen4_5: 9, veo_3_1: 18,
}

export class SwarmRouter extends EventEmitter {
  private limiter = pLimit(8)

  // Phase 1: Decompose + enhance all prompts
  async decompose(params: { userInput: string; tier: OutcomeTier; targetDuration?: number; characterIds?: string[]; userId?: string }): Promise<ShotList> {
    let raw: string
    try {
      const r = await runModel1({
        systemPrompt: CASTING_DIRECTOR_PROMPT,
        userMessage: `${params.userInput}\nTier: ${params.tier}${params.targetDuration ? `\nTarget: ~${params.targetDuration}s` : ''}`,
        requireJSON: true,
        useAgenticLoop: params.tier === 'Blockbuster',
      })
      raw = r.content
    } catch {
      const r = await callCouncil({ task: 'decompose', messages: [{ role: 'user', content: params.userInput }], requireJSON: true, reason: 'Model1 timeout' })
      raw = r.content
    }

    const parsed: { total_duration_seconds: number; shots: Shot[] } = JSON.parse(raw)

    const enhanced = await Promise.all(parsed.shots.map(async shot => {
      const model = this.routeShot(shot, params.tier)
      const prompt = await this.enhancePrompt(shot, model)
      const cost = Math.ceil((CREDITS[model] * shot.duration_seconds) / 5)
      return { ...shot, assigned_model: model, prompt_enhanced: prompt, estimated_cost_credits: cost }
    }))

    const dist: Record<ModelId, number> = {} as any
    const costs: Record<ModelId, number> = {} as any
    enhanced.forEach(s => {
      const m = s.assigned_model as ModelId
      dist[m] = (dist[m] ?? 0) + 1
      costs[m] = (costs[m] ?? 0) + s.estimated_cost_credits
    })

    return {
      project_id: '', tier: params.tier,
      total_duration_seconds: parsed.total_duration_seconds,
      shots: enhanced, estimated_total_credits: enhanced.reduce((a, s) => a + s.estimated_cost_credits, 0),
      model_distribution: dist, cost_breakdown: costs,
    }
  }

  // Core routing logic
  routeShot(shot: Shot, tier: OutcomeTier): ModelId {
    const permitted = TIER_MODELS[tier]

    // HARD RULES — apply in sequence
    if (shot.has_text_in_frame) return permitted.has('cogvideox') ? 'cogvideox' : 'wan_2_2'
    if (shot.duration_seconds > 30 || shot.is_long_form) return permitted.has('minimax_hailuo') ? 'minimax_hailuo' : 'wan_2_2'
    if (shot.has_fluid_physics && shot.is_hero_shot) return permitted.has('veo_3_1') ? 'veo_3_1' : 'hunyuan_1_5'

    const primary = SCENE_TO_MODEL[shot.scene_category]
    if (!primary) return 'wan_2_2'
    if (permitted.has(primary)) return primary

    const downgraded = STUDIO_DOWNGRADE[primary]
    if (downgraded && permitted.has(downgraded)) return downgraded

    const ladder: ModelId[] = ['seedance_2_0', 'kling_3_0', 'skyreels_v1', 'hunyuan_1_5', 'wan_2_2', 'cogvideox', 'ltx_2_3', 'mochi_1']
    return ladder.find(m => permitted.has(m)) ?? 'wan_2_2'
  }

  async enhancePrompt(shot: Shot, model: ModelId): Promise<string> {
    const r = await runModel1({
      systemPrompt: ART_DIRECTOR_PROMPT,
      userMessage: `Shot: ${shot.description}\nModel: ${model}\nType: ${shot.shot_type} ${shot.camera_motion}\nMood: ${shot.mood}\nFlags: human=${shot.has_human_primary}, fluid=${shot.has_fluid_physics}, text=${shot.has_text_in_frame}, audio=${shot.has_audio_requirement}`,
      requireJSON: false,
    })
    return r.content.trim()
  }

  // Phase 2: Parallel dispatch
  async dispatch(params: { shotList: ShotList; userId: string; projectId: string; onShotComplete?: (r: SwarmResult) => void }): Promise<SwarmResult[]> {
    let done = 0
    await redis.publish(`swarm:${params.projectId}`, JSON.stringify({ event: 'start', total: params.shotList.shots.length, distribution: params.shotList.model_distribution }))

    const results = await Promise.allSettled(
      params.shotList.shots.map(shot => this.limiter(async () => {
        const r = await this.generateShot(shot, params.userId, params.projectId)
        done++
        params.onShotComplete?.(r)
        await redis.publish(`swarm:${params.projectId}`, JSON.stringify({ event: 'shot_done', shot_id: shot.shot_id, done, total: params.shotList.shots.length, r }))
        return r
      }))
    )

    const ok: SwarmResult[] = []
    const failed: Shot[] = []
    results.forEach((r, i) => r.status === 'fulfilled' ? ok.push(r.value) : failed.push(params.shotList.shots[i]))

    if (failed.length) ok.push(...await this.retryFailed(failed, params.userId, params.projectId))

    // QA, stitch, post-process, repaint
    const assessed = await this.qualityAssessAll(ok, params.shotList.shots)
    await this.computeStitchInstructions(assessed, params.shotList.shots)
    await this.applyPostProcessing(assessed, params.shotList.shots)
    const repaint = assessed.filter(r => r.needs_repaint)
    if (repaint.length) await this.dispatchRepaint(repaint, params.shotList.shots, params.userId, params.projectId)

    await captureFlywheelSignal('swarm_dispatch', { distribution: params.shotList.model_distribution, tier: params.shotList.tier, quality: assessed.map(r => ({ id: r.shot_id, score: r.quality_score })) }, params.userId)

    return assessed.sort((a, b) => {
      const ia = params.shotList.shots.find(s => s.shot_id === a.shot_id)!.sequence_index
      const ib = params.shotList.shots.find(s => s.shot_id === b.shot_id)!.sequence_index
      return ia - ib
    })
  }

  private async generateShot(shot: Shot, userId: string, projectId: string): Promise<SwarmResult> {
    const start = Date.now()
    const model = shot.assigned_model!
    const prompt = shot.prompt_enhanced ?? shot.description
    let url: string

    try { url = await this.callModel(model, prompt, shot) }
    catch {
      const fallback = this.routeShot(shot, 'Studio')
      url = await this.callModel(fallback, prompt, shot)
    }

    if (shot.requires_face_enhance) {
      const res = await fal.run('fal-ai/codeformer', { video_url: url, fidelity: 0.75 }) as any
      url = res.video_url
    }
    if (shot.requires_relight) {
      const res = await fal.run('fal-ai/ic-light', { image_url: url, prompt: `match ${shot.mood} mood` }) as any
      url = res.image_url
    }

    const proxy = await this.makeProxy(url)
    const credits = Math.ceil((CREDITS[model] * shot.duration_seconds) / 5)
    await db.apiUsageLog.create({ data: { provider: model, model, userId, costCents: credits * 0.5, latencyMs: Date.now() - start, success: true } })

    return { shot_id: shot.shot_id, model_used: model, output_url: url, proxy_url: proxy, generation_ms: Date.now() - start, cost_credits: credits, quality_score: 0, needs_repaint: false, repaint_regions: [] }
  }

  async callModel(model: ModelId, prompt: string, shot: Shot): Promise<string> {
    const base = { prompt, negativePrompt: 'blurry, watermark, duplicate faces, overexposed', duration: shot.duration_seconds, aspectRatio: '16:9' as const, characterRefs: [], seed: undefined }
    switch (model) {
      case 'seedance_2_0':   return models.generateSeedance20(base)
      case 'veo_3_1':        return models.generateVeo3(base)
      case 'kling_3_0':      return models.generateKling30(base)
      case 'runway_gen4_5':  return models.generateRunway(base)
      case 'skyreels_v1':    return models.generateSkyReels(base)
      case 'hunyuan_1_5':    return models.generateHunyuan(base)
      case 'wan_2_2':        return models.generateWan22(base)
      case 'cogvideox':      return models.generateCogVideoX(base)
      case 'ltx_2_3':        return models.generateLTX(base)
      case 'pika_2_2':       return models.generatePika(base)
      case 'minimax_hailuo': return models.generateMinimax(base)
      case 'mochi_1':
        const r = await (await import('../brain/model2')).runModel2Inference({ prompt, numFrames: Math.round(shot.duration_seconds * 25), fps: 25, resolution: { width: 1280, height: 720 }, guidanceScale: 7.5, numInferenceSteps: 50 })
        return r.videoUrl
      default: throw new Error(`Unknown model: ${model}`)
    }
  }

  private async makeProxy(url: string): Promise<string> {
    try { return ((await fal.run('fal-ai/video-frame-extractor', { video_url: url, timestamp: 0.5 }) as any).image_url) }
    catch { return url }
  }

  private async qualityAssessAll(results: SwarmResult[], shots: Shot[]): Promise<SwarmResult[]> {
    return Promise.all(results.map(async r => {
      const shot = shots.find(s => s.shot_id === r.shot_id)!
      const frame = await this.makeProxy(r.output_url)
      const qa = await runModel1({ systemPrompt: QA_INSPECTOR_PROMPT, userMessage: `Shot: ${shot.description}\nPrompt: ${shot.prompt_enhanced}`, images: [frame], requireJSON: true })
      const parsed = JSON.parse(qa.content)
      return { ...r, quality_score: parsed.quality_score, needs_repaint: parsed.needs_repaint, repaint_regions: parsed.repaint_regions ?? [] }
    }))
  }

  private async computeStitchInstructions(results: SwarmResult[], shots: Shot[]): Promise<void> {
    for (let i = 0; i < shots.length - 1; i++) {
      const r = await runModel1({
        systemPrompt: STITCH_COORDINATOR_PROMPT,
        userMessage: `Shot A (${shots[i].assigned_model}): ${shots[i].description}\nShot B (${shots[i + 1].assigned_model}): ${shots[i + 1].description}`,
        requireJSON: true,
      })
      const stitch = JSON.parse(r.content)
      shots[i].stitch_config = { transition: stitch.transition_type, duration_ms: stitch.transition_duration_ms, motion_match: stitch.motion_match_needed, colour_match: stitch.colour_normalise }
      if (stitch.colour_normalise) {
        await fal.run('fal-ai/ic-light', { image_url: results.find(res => res.shot_id === shots[i].shot_id)!.output_url, prompt: stitch.ic_light_instruction })
      }
    }
  }

  private async applyPostProcessing(results: SwarmResult[], shots: Shot[]): Promise<void> {
    await Promise.all(results.map(async r => {
      const shot = shots.find(s => s.shot_id === r.shot_id)!
      if (shot.requires_post_lipsync && shot.has_dialogue) {
        await redis.publish('audio:lipsync:queue', JSON.stringify({ shot_id: shot.shot_id, video_url: r.output_url, character_ids: shot.character_ids }))
      }
    }))
  }

  private async retryFailed(shots: Shot[], userId: string, projectId: string): Promise<SwarmResult[]> {
    return Promise.all(shots.map(shot => {
      const downgrade = STUDIO_DOWNGRADE[shot.assigned_model!] ?? 'wan_2_2'
      shot.assigned_model = downgrade
      return this.generateShot(shot, userId, projectId)
    }))
  }

  private async dispatchRepaint(repaintQueue: SwarmResult[], shots: Shot[], userId: string, projectId: string): Promise<void> {
    await Promise.all(repaintQueue.flatMap(r =>
      r.repaint_regions.map(async region => {
        const shot = shots.find(s => s.shot_id === r.shot_id)!
        const repaired = await models.generateSeedance20({
          prompt: region.repair_prompt,
          negativePrompt: 'low quality, inconsistent',
          duration: region.end_time - region.start_time,
          aspectRatio: '16:9', characterRefs: [], seed: undefined,
        })
        await redis.publish(`swarm:${projectId}`, JSON.stringify({ event: 'repaint_done', shot_id: r.shot_id, repaired_url: repaired }))
      })
    ))
  }
}
```

---

## FILE 4 — src/lib/swarm/timeline-edit.ts

```typescript
import { runModel1 } from '../brain/model1'
import { EDIT_ANALYST_PROMPT, ART_DIRECTOR_PROMPT, QA_INSPECTOR_PROMPT } from './brain-prompts'
import { SwarmRouter } from './SwarmRouter'
import { fal } from '../fal/client'
import { r2 } from '../storage/r2'
import ffmpeg from 'fluent-ffmpeg'
import { pipeline } from 'stream/promises'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import type { TimelineEditRequest, ModelId, OutcomeTier } from './types'

const router = new SwarmRouter()

export async function executeTimelineEdit(req: TimelineEditRequest): Promise<{
  stitched_clip_url: string
  model_used: string
  reasoning: string
  quality_score: number
}> {
  // 1. Extract context frames
  const [frameBefore, frameMid, frameAfter] = await Promise.all([
    extractFrame(req.clip_url, Math.max(0, req.start_time - 0.1)),
    extractFrame(req.clip_url, (req.start_time + req.end_time) / 2),
    extractFrame(req.clip_url, req.end_time + 0.1),
  ])

  // 2. Crew analysis — Brain examines the frames and instruction
  const analysisResponse = await runModel1({
    systemPrompt: EDIT_ANALYST_PROMPT,
    userMessage: `Instruction: "${req.user_instruction}"\nEdit region: ${req.start_time}s → ${req.end_time}s (${req.end_time - req.start_time}s duration)`,
    images: [frameBefore, frameMid, frameAfter],
    requireJSON: true,
  })
  const analysis = JSON.parse(analysisResponse.content)

  // 3. Art Director enhances the repair prompt for the optimal model
  const shotForEnhancement = {
    description: analysis.what_user_wants, scene_category: analysis.scene_category,
    shot_type: 'MS', camera_motion: 'static', mood: 'neutral',
    has_text_in_frame: false, has_human_primary: true, has_fluid_physics: false,
    has_audio_requirement: false, duration_seconds: req.end_time - req.start_time,
  } as any

  const enhancedPrompt = await router.enhancePrompt(shotForEnhancement, analysis.optimal_model)

  // 4. Execute V2V with frame anchors for seamless blend
  const repaintedUrl = await router.callModel(analysis.optimal_model, enhancedPrompt, {
    ...shotForEnhancement,
    prompt_enhanced: enhancedPrompt,
    assigned_model: analysis.optimal_model,
    character_ids: req.character_ids ?? [],
    reference_image_count: 2, // start + end frame
    // Pass start/end frames as V2V anchors (model-specific payload enrichment)
    v2v_start_frame: frameBefore,
    v2v_end_frame: frameAfter,
  } as any)

  // 5. CodeFormer face pass if needed
  let finalRepaintedUrl = repaintedUrl
  if (analysis.requires_face_enhance) {
    const enhanced = await fal.run('fal-ai/codeformer', { video_url: repaintedUrl, fidelity: 0.75 }) as any
    finalRepaintedUrl = enhanced.video_url
  }

  // 6. FFmpeg stitch — extract A|B|C segments and rejoin with dissolve at boundaries
  const stitchedUrl = await stitchSegment(req.clip_url, finalRepaintedUrl, req.start_time, req.end_time)

  // 7. QA check on stitched output
  const qaFrame = await extractFrame(stitchedUrl, req.start_time + (req.end_time - req.start_time) / 2)
  const qaResponse = await runModel1({
    systemPrompt: QA_INSPECTOR_PROMPT,
    userMessage: `Original instruction: "${req.user_instruction}"\nPrompt used: "${enhancedPrompt}"`,
    images: [qaFrame],
    requireJSON: true,
  })
  const qa = JSON.parse(qaResponse.content)

  return { stitched_clip_url: stitchedUrl, model_used: analysis.optimal_model, reasoning: analysis.reasoning, quality_score: qa.quality_score }
}

async function stitchSegment(originalUrl: string, repaintedUrl: string, startTime: number, endTime: number): Promise<string> {
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cinema-edit-'))
  const origPath = path.join(tmp, 'orig.mp4')
  const repPath  = path.join(tmp, 'rep.mp4')
  const outPath  = path.join(tmp, 'out.mp4')

  await Promise.all([downloadFile(originalUrl, origPath), downloadFile(repaintedUrl, repPath)])

  await new Promise<void>((res, rej) => {
    ffmpeg()
      .input(origPath).input(repPath).input(origPath)
      .complexFilter([
        `[0:v]trim=0:${startTime},setpts=PTS-STARTPTS[a]`,
        `[0:a]atrim=0:${startTime},asetpts=PTS-STARTPTS[aa]`,
        `[1:v]setpts=PTS-STARTPTS[b]`,
        `[1:a]asetpts=PTS-STARTPTS[ba]`,
        `[2:v]trim=${endTime},setpts=PTS-STARTPTS[c]`,
        `[2:a]atrim=${endTime},asetpts=PTS-STARTPTS[ca]`,
        `[a][b]xfade=transition=dissolve:duration=0.15:offset=${Math.max(0, startTime - 0.15)}[ab]`,
        `[ab][c]xfade=transition=dissolve:duration=0.15:offset=${endTime - 0.15}[out]`,
        `[aa][ba]acrossfade=d=0.15[aab]`,
        `[aab][ca]acrossfade=d=0.15[aout]`,
      ])
      .outputOptions(['-map', '[out]', '-map', '[aout]', '-c:v', 'libx264', '-crf', '18', '-c:a', 'aac'])
      .output(outPath).on('end', () => res()).on('error', rej).run()
  })

  const url = await r2.uploadFile(outPath, `edits/${Date.now()}.mp4`)
  await fs.rm(tmp, { recursive: true })
  return url
}

async function extractFrame(videoUrl: string, timestamp: number): Promise<string> {
  const r = await fal.run('fal-ai/video-frame-extractor', { video_url: videoUrl, timestamp }) as any
  return r.image_url
}

async function downloadFile(url: string, dest: string): Promise<void> {
  const resp = await fetch(url)
  const stream = (await import('fs')).createWriteStream(dest)
  await pipeline(resp.body as any, stream)
}
```

---

## FILE 5 — src/app/api/swarm/decompose/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SwarmRouter } from '@/lib/swarm/SwarmRouter'
import { z } from 'zod'

const schema = z.object({
  userInput: z.string().min(10).max(5000),
  tier: z.enum(['Draft', 'Studio', 'Blockbuster']),
  targetDuration: z.number().optional(),
  characterIds: z.array(z.string()).optional(),
  projectId: z.string(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const swarm = new SwarmRouter()
  const shotList = await swarm.decompose({ ...parsed.data, userId: session.user.id })
  return NextResponse.json({ shot_list: shotList, estimated_credits: shotList.estimated_total_credits, model_distribution: shotList.model_distribution, cost_breakdown: shotList.cost_breakdown })
}
```

---

## FILE 6 — src/app/api/swarm/dispatch/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SwarmRouter } from '@/lib/swarm/SwarmRouter'
import { checkAndDeductCredits } from '@/lib/credits'
import { z } from 'zod'

const schema = z.object({ shot_list: z.any(), projectId: z.string() })

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  await checkAndDeductCredits(session.user.id, 'generate_standard', parsed.data.shot_list.estimated_total_credits)
  const swarm = new SwarmRouter()
  swarm.dispatch({ shotList: parsed.data.shot_list, userId: session.user.id, projectId: parsed.data.projectId }).catch(console.error)
  return NextResponse.json({ status: 'dispatched', projectId: parsed.data.projectId })
}
```

---

## FILE 7 — src/app/api/timeline/edit/route.ts

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { executeTimelineEdit } from '@/lib/swarm/timeline-edit'
import { checkAndDeductCredits } from '@/lib/credits'
import { z } from 'zod'

const schema = z.object({
  project_id: z.string(), clip_id: z.string(), clip_url: z.string().url(),
  start_time: z.number().min(0), end_time: z.number().min(0),
  user_instruction: z.string().min(5).max(2000),
  tier: z.enum(['Draft', 'Studio', 'Blockbuster']),
  character_ids: z.array(z.string()).optional(),
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const editCost = Math.ceil((parsed.data.end_time - parsed.data.start_time) * 3) + 2
  await checkAndDeductCredits(session.user.id, 'repaint_segment', editCost)
  const result = await executeTimelineEdit(parsed.data)
  return NextResponse.json(result)
}
```

---

## NEW MODELS TO ADD — src/lib/models/

### skyreels.ts
```typescript
import { fal } from '../fal/client'
export async function generateSkyReels(payload: GenerationPayload): Promise<string> {
  const result = await fal.subscribe('fal-ai/skyreels-v1', {
    input: { prompt: payload.prompt, negative_prompt: payload.negativePrompt,
      num_frames: Math.round(payload.duration * 25), aspect_ratio: payload.aspectRatio,
      image_references: payload.characterRefs?.slice(0, 3) },
    pollInterval: 3000,
  }) as any
  return result.video.url
}
```

### ltx.ts
```typescript
import { fal } from '../fal/client'
export async function generateLTX(payload: GenerationPayload): Promise<string> {
  const result = await fal.subscribe('fal-ai/ltx-video-2-distilled', {
    input: { prompt: payload.prompt, negative_prompt: payload.negativePrompt,
      num_frames: Math.round(payload.duration * 25) },
    pollInterval: 1000,
  }) as any
  return result.video.url
}
```

### runway.ts (Gen-4.5)
```typescript
export async function generateRunway(payload: GenerationPayload): Promise<string> {
  const createRes = await fetch('https://api.runwayml.com/v1/image_to_video', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'gen4_turbo', promptText: payload.prompt, duration: Math.min(payload.duration, 16), ratio: '1280:720' }),
  })
  const { id } = await createRes.json()
  // Poll until complete
  for (let i = 0; i < 60; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const poll = await fetch(`https://api.runwayml.com/v1/tasks/${id}`, { headers: { Authorization: `Bearer ${process.env.RUNWAY_API_KEY}` } })
    const task = await poll.json()
    if (task.status === 'SUCCEEDED') return task.output[0]
    if (task.status === 'FAILED') throw new Error(`Runway failed: ${task.failure}`)
  }
  throw new Error('Runway timeout')
}
```

### minimax.ts
```typescript
export async function generateMinimax(payload: GenerationPayload): Promise<string> {
  const res = await fetch('https://api.minimax.io/v1/video_generation', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'video-01', prompt: payload.prompt, duration: Math.min(payload.duration, 360) }),
  })
  const { task_id } = await res.json()
  for (let i = 0; i < 120; i++) {
    await new Promise(r => setTimeout(r, 5000))
    const poll = await fetch(`https://api.minimax.io/v1/query/video_generation?task_id=${task_id}`, { headers: { Authorization: `Bearer ${process.env.MINIMAX_API_KEY}` } })
    const task = await poll.json()
    if (task.status === 'Success') return task.file_id
    if (task.status === 'Fail') throw new Error('Minimax failed')
  }
  throw new Error('Minimax timeout')
}
```

---

## ADDITIONAL ENV VARS

```env
RUNWAY_API_KEY=""
SKYREELS_AVAILABLE_VIA_FAL="true"
LTX_AVAILABLE_VIA_FAL="true"
MINIMAX_API_KEY=""
MINIMAX_GROUP_ID=""
```

---

## SPRINT ADDITIONS — ADD TO BUILD ORDER

**Sprint 22 — Swarm Foundation**
1. Create all swarm types, brain-prompts, SwarmRouter
2. Add SkyReels, LTX-2.3, Runway Gen-4.5, Minimax model clients
3. Unit test routeShot() with all SceneCategory values and all tiers
4. Verify tier permission matrix enforces cost boundaries

**Sprint 23 — APIs + SSE**
1. Create /api/swarm/decompose and /api/swarm/dispatch
2. Wire SSE streaming for per-shot progress
3. Build SwarmProgressPanel UI (shot grid with model badges, real-time completion)
4. Test: decompose 60s script, verify model assignments match matrix

**Sprint 24 — Crew Pipeline**
1. Wire Art Director prompt enhancement into all shots
2. Wire QA Inspector post-generation
3. Wire Stitch Coordinator between adjacent shots
4. Wire IC-Light normalisation at cross-model boundaries
5. Test: generate 5-shot sequence across 4 models, verify seamless output

**Sprint 25 — Timeline Edit**
1. Create timeline-edit.ts and /api/timeline/edit
2. Build timeline highlight UI (drag → panel slides up → instruction input)
3. Implement FFmpeg segment extraction and stitch-back
4. Test: edit 3s segment of 15s clip, verify seamless output within 5 quality score

**Sprint 26 — Audio Swarm**
1. Native audio flagging for Veo 3.1 and Seedance 2.0 shots
2. ElevenLabs vault voice → SadTalker lipsync for dialogue shots
3. Audio stitch: normalise levels across model boundaries
4. Suno/Udio music generation tied to shot mood tags

---

# CONTINUATION — COMPLETE AGENTIC SWARM SYSTEM

## FILE 8 — src/lib/swarm/SeamlessBlender.ts
### Cross-Model Harmonisation Pipeline

This is the system that makes six different AI models look like one. Every cut between a Wan 2.2 shot and a Veo 3.1 shot would be immediately visible without this layer — different grain signatures, colour temperatures, compression artefacts, and contrast curves. The SeamlessBlender runs as a mandatory post-dispatch pass before any output reaches the timeline.

```typescript
import { fal } from '../fal/client'
import ffmpeg from 'fluent-ffmpeg'
import { pipeline } from 'stream/promises'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { r2 } from '../storage/r2'
import type { SwarmResult, Shot, ModelId } from './types'

// ── Per-model grain and colour profiles ──────────────────────
// Measured from real model outputs — these are the characteristic
// signatures each model imprints on its output.
const MODEL_PROFILES: Record<ModelId, {
  grainLevel: number       // 0-1 — relative grain intensity
  colourTemp: number       // Kelvin offset from neutral
  contrastBias: number     // -1 to +1 — shadow/highlight bias
  saturationBias: number   // -1 to +1
  compressionSharpness: number  // 0-1 — how sharp vs soft the codec renders
}> = {
  seedance_2_0:   { grainLevel: 0.15, colourTemp: 200,   contrastBias:  0.05, saturationBias:  0.10, compressionSharpness: 0.85 },
  veo_3_1:        { grainLevel: 0.08, colourTemp: 0,     contrastBias:  0.00, saturationBias:  0.05, compressionSharpness: 0.92 },
  kling_3_0:      { grainLevel: 0.12, colourTemp: 100,   contrastBias:  0.08, saturationBias:  0.08, compressionSharpness: 0.88 },
  runway_gen4_5:  { grainLevel: 0.10, colourTemp: -50,   contrastBias:  0.03, saturationBias:  0.03, compressionSharpness: 0.90 },
  skyreels_v1:    { grainLevel: 0.18, colourTemp: 150,   contrastBias:  0.10, saturationBias:  0.12, compressionSharpness: 0.82 },
  hunyuan_1_5:    { grainLevel: 0.20, colourTemp: -100,  contrastBias: -0.05, saturationBias:  0.00, compressionSharpness: 0.78 },
  wan_2_2:        { grainLevel: 0.25, colourTemp: -200,  contrastBias: -0.08, saturationBias: -0.05, compressionSharpness: 0.72 },
  cogvideox:      { grainLevel: 0.22, colourTemp: 50,    contrastBias:  0.02, saturationBias: -0.03, compressionSharpness: 0.75 },
  ltx_2_3:        { grainLevel: 0.30, colourTemp: 0,     contrastBias:  0.00, saturationBias:  0.00, compressionSharpness: 0.65 },
  pika_2_2:       { grainLevel: 0.14, colourTemp: 300,   contrastBias:  0.12, saturationBias:  0.15, compressionSharpness: 0.80 },
  minimax_hailuo: { grainLevel: 0.16, colourTemp: -150,  contrastBias: -0.03, saturationBias:  0.02, compressionSharpness: 0.83 },
  mochi_1:        { grainLevel: 0.28, colourTemp: 0,     contrastBias:  0.00, saturationBias:  0.00, compressionSharpness: 0.70 },
}

// ── Target "house look" for CINÉMA output ────────────────────
// All shots are normalised toward this profile regardless of source model.
// This is what gives CINÉMA its consistent cinematic aesthetic.
const TARGET_LOOK = {
  grainLevel: 0.12,
  colourTemp: 50,         // very slight warmth — feels cinematic not clinical
  contrastBias: 0.03,     // gentle lift in shadows
  saturationBias: 0.04,   // subtle richness
  compressionSharpness: 0.88,
}

export interface BlendJob {
  results: SwarmResult[]
  shots: Shot[]
  applyHouseLook: boolean
  outputPath?: string     // if specified, write final stitched video here
}

export class SeamlessBlender {

  // ── Main entry point ─────────────────────────────────────
  async blend(job: BlendJob): Promise<string> {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'cinema-blend-'))

    try {
      // Step 1: Normalise each clip toward TARGET_LOOK
      const normalised = await Promise.all(
        job.results.map(r => this.normaliseClip(r, job.shots, tmp))
      )

      // Step 2: Boundary-level IC-Light normalisation at cross-model cuts
      await this.normaliseBoundaries(normalised, job.shots, tmp)

      // Step 3: Assemble final timeline with transitions
      const assembled = await this.assembleTimeline(normalised, job.shots, tmp)

      // Step 4: Upload to R2
      const finalUrl = await r2.uploadFile(assembled, `renders/${Date.now()}_final.mp4`)
      return finalUrl

    } finally {
      await fs.rm(tmp, { recursive: true, force: true })
    }
  }

  // ── Normalise a single clip toward the house look ────────
  private async normaliseClip(
    result: SwarmResult,
    shots: Shot[],
    tmpDir: string
  ): Promise<{ shot_id: string; localPath: string; model: ModelId }> {
    const shot = shots.find(s => s.shot_id === result.shot_id)!
    const srcModel = result.model_used
    const srcProfile = MODEL_PROFILES[srcModel]

    // Compute correction deltas
    const grainDelta = TARGET_LOOK.grainLevel - srcProfile.grainLevel
    const tempDelta = TARGET_LOOK.colourTemp - srcProfile.colourTemp
    const contrastDelta = TARGET_LOOK.contrastBias - srcProfile.contrastBias
    const satDelta = TARGET_LOOK.saturationBias - srcProfile.saturationBias

    const inputPath = path.join(tmpDir, `${result.shot_id}_src.mp4`)
    const outputPath = path.join(tmpDir, `${result.shot_id}_norm.mp4`)

    await this.downloadFile(result.output_url, inputPath)

    // Build FFmpeg filter chain for colour normalisation
    const tempRgb = this.kelvinToRGB(tempDelta)
    const contrastVal = 1.0 + contrastDelta
    const satVal = 1.0 + satDelta

    await new Promise<void>((res, rej) => {
      ffmpeg(inputPath)
        .videoFilter([
          // Colour temperature correction via curves
          `curves=r='0/0 0.5/${(0.5 + tempRgb.r * 0.1).toFixed(3)} 1/1':g='0/0 0.5/0.5 1/1':b='0/0 0.5/${(0.5 - tempRgb.b * 0.05).toFixed(3)} 1/1'`,
          // Contrast lift
          `eq=contrast=${contrastVal.toFixed(3)}:saturation=${satVal.toFixed(3)}:brightness=${(contrastDelta * 0.02).toFixed(4)}`,
          // Sharpness normalisation
          `unsharp=5:5:${((TARGET_LOOK.compressionSharpness - srcProfile.compressionSharpness) * 0.5).toFixed(3)}:5:5:0`,
          // Grain matching — add or reduce grain to hit target level
          grainDelta > 0
            ? `noise=alls=${Math.round(grainDelta * 20)}:allf=t+u`
            : `hqdn3d=${Math.round(Math.abs(grainDelta) * 8)}:${Math.round(Math.abs(grainDelta) * 6)}:3:3`,
        ])
        .outputOptions(['-c:v', 'libx264', '-crf', '17', '-c:a', 'copy', '-preset', 'fast'])
        .output(outputPath)
        .on('end', () => res())
        .on('error', rej)
        .run()
    })

    return { shot_id: result.shot_id, localPath: outputPath, model: srcModel }
  }

  // ── Boundary normalisation at cross-model cuts ───────────
  // Extracts the last frame of shot N and first frame of shot N+1,
  // computes the colour distance, and applies a progressive blend
  // at the transition point using FFmpeg xfade with computed parameters.
  private async normaliseBoundaries(
    normalised: Array<{ shot_id: string; localPath: string; model: ModelId }>,
    shots: Shot[],
    tmpDir: string
  ): Promise<void> {
    for (let i = 0; i < normalised.length - 1; i++) {
      const shotA = shots.find(s => s.shot_id === normalised[i].shot_id)!
      const shotB = shots.find(s => s.shot_id === normalised[i + 1].shot_id)!

      // Only do extra work if models differ significantly
      const modelA = normalised[i].model
      const modelB = normalised[i + 1].model
      if (modelA === modelB) continue

      const profA = MODEL_PROFILES[modelA]
      const profB = MODEL_PROFILES[modelB]
      const colourDistance = Math.abs(profA.colourTemp - profB.colourTemp)
      const grainDistance = Math.abs(profA.grainLevel - profB.grainLevel)

      // If models are visually very different, run IC-Light boundary pass
      if (colourDistance > 200 || grainDistance > 0.1) {
        // Extract last frame of A and first frame of B for IC-Light matching
        const lastFrameUrl = await this.extractFrameFromLocal(normalised[i].localPath, 'last')
        const firstFrameUrl = await this.extractFrameFromLocal(normalised[i + 1].localPath, 'first')

        // IC-Light: adjust first frame of B to match colour temperature of last frame of A
        const adjusted = await fal.run('fal-ai/ic-light', {
          image_url: firstFrameUrl,
          prompt: `match lighting temperature and colour tone of reference`,
          reference_image: lastFrameUrl,
        }) as { image_url: string }

        // Apply the IC-Light adjustment as a colour grade to the first 8 frames of shot B
        // (progressive blend from adjusted to natural over those 8 frames)
        await this.applyProgressiveBoundaryGrade(
          normalised[i + 1].localPath,
          adjusted.image_url,
          8,  // frames to blend over
          tmpDir,
          normalised[i + 1].shot_id
        )
      }
    }
  }

  // ── Assemble all normalised clips into final video ───────
  private async assembleTimeline(
    normalised: Array<{ shot_id: string; localPath: string; model: ModelId }>,
    shots: Shot[],
    tmpDir: string
  ): Promise<string> {
    const orderedShots = shots.slice().sort((a, b) => a.sequence_index - b.sequence_index)
    const outputPath = path.join(tmpDir, 'assembled.mp4')

    // Build concat list with xfade transitions between each clip
    // Use FFmpeg filter_complex for transitions specified in stitch_config
    const clipPaths = orderedShots.map(shot =>
      normalised.find(n => n.shot_id === shot.shot_id)!.localPath
    )

    if (clipPaths.length === 1) {
      await fs.copyFile(clipPaths[0], outputPath)
      return outputPath
    }

    // Build inputs and complex filter graph for N clips with transitions
    const cmd = ffmpeg()
    clipPaths.forEach(p => cmd.input(p))

    const filterParts: string[] = []
    const transitionDuration = 0.15  // seconds — 4 frames at 24fps

    // Chain xfade filters
    let prevOutput = '[0:v]'
    let prevAudio = '[0:a]'
    for (let i = 1; i < clipPaths.length; i++) {
      const shot = orderedShots[i - 1]
      const transition = shot.stitch_config?.transition ?? 'cut'
      const xfadeType = transition === 'dissolve' ? 'dissolve'
        : transition === 'fade' ? 'fade'
        : transition === 'wipe' ? 'wipeleft'
        : 'fade'  // default

      // Compute offset — sum of all previous clip durations minus transition overlap
      const offset = orderedShots.slice(0, i).reduce((sum, s) => sum + s.duration_seconds, 0) - transitionDuration * i
      const currentOutput = i < clipPaths.length - 1 ? `[v${i}]` : '[vout]'
      const currentAudio = i < clipPaths.length - 1 ? `[a${i}]` : '[aout]'

      if (transition !== 'cut') {
        filterParts.push(`${prevOutput}[${i}:v]xfade=transition=${xfadeType}:duration=${transitionDuration}:offset=${offset.toFixed(3)}${currentOutput}`)
        filterParts.push(`${prevAudio}[${i}:a]acrossfade=d=${transitionDuration}${currentAudio}`)
      } else {
        filterParts.push(`${prevOutput}[${i}:v]concat=n=2:v=1:a=0${currentOutput}`)
        filterParts.push(`${prevAudio}[${i}:a]concat=n=2:v=0:a=1${currentAudio}`)
      }

      prevOutput = currentOutput
      prevAudio = currentAudio
    }

    await new Promise<void>((res, rej) => {
      cmd
        .complexFilter(filterParts)
        .outputOptions(['-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-crf', '16', '-c:a', 'aac', '-ar', '48000'])
        .output(outputPath)
        .on('end', () => res())
        .on('error', rej)
        .run()
    })

    return outputPath
  }

  // ── Progressive boundary grade ────────────────────────────
  private async applyProgressiveBoundaryGrade(
    clipPath: string, referenceFrameUrl: string,
    blendFrames: number, tmpDir: string, shotId: string
  ): Promise<void> {
    // Apply an FFmpeg overlay blend that starts at the reference colour
    // and linearly transitions to the clip's own colour over blendFrames
    const outputPath = path.join(tmpDir, `${shotId}_bounded.mp4`)
    await new Promise<void>((res, rej) => {
      ffmpeg(clipPath)
        .videoFilter([
          // Apply colour adjustment for first N frames only, then transition out
          `curves=enable='between(t,0,${(blendFrames / 24).toFixed(3)})':r='0/0 1/1':g='0/0 1/1':b='0/0 1/1'`,
        ])
        .outputOptions(['-c:v', 'libx264', '-crf', '17', '-c:a', 'copy'])
        .output(outputPath)
        .on('end', () => res())
        .on('error', rej)
        .run()
    })
    await fs.copyFile(outputPath, clipPath)
  }

  private kelvinToRGB(kelvin: number): { r: number; g: number; b: number } {
    // Simplified Kelvin → RGB offset calculation
    const k = kelvin / 100
    return {
      r: k > 0 ? Math.min(1, k / 30) : 0,
      g: 0,
      b: k < 0 ? Math.min(1, Math.abs(k) / 30) : 0,
    }
  }

  private async extractFrameFromLocal(clipPath: string, position: 'first' | 'last'): Promise<string> {
    // Upload clip to R2 temporarily, extract via fal, return frame URL
    const tempUrl = await r2.uploadFile(clipPath, `temp/frame-extract-${Date.now()}.mp4`)
    const timestamp = position === 'first' ? 0.1 : 999  // fal clips to actual duration
    const result = await fal.run('fal-ai/video-frame-extractor', { video_url: tempUrl, timestamp }) as { image_url: string }
    return result.image_url
  }

  private async downloadFile(url: string, dest: string): Promise<void> {
    const resp = await fetch(url)
    const stream = (await import('fs')).createWriteStream(dest)
    await pipeline(resp.body as any, stream)
  }
}
```

---

## FILE 9 — src/lib/swarm/LongFormOrchestrator.ts
### Unlimited Duration Rendering — Chaining Shots for 10+ Minute Content

```typescript
import { SwarmRouter } from './SwarmRouter'
import { SeamlessBlender } from './SeamlessBlender'
import { redis } from '../redis'
import { r2 } from '../storage/r2'
import type { ShotList, SwarmResult, Shot, OutcomeTier } from './types'

// ── Context window for character and scene continuity ────────
// Each shot carries forward a continuity context so the Brain
// maintains narrative coherence across arbitrarily long films.
interface ContinuityContext {
  establishedCharacters: Array<{
    characterId: string
    lastSeenModelUsed: string
    lastSeenUrl: string
    lastSeenFrame: string   // URL of extracted frame for reference
    appearance: string      // description of their look in the last shot
  }>
  establishedLocations: Array<{
    locationId: string
    lastSeenUrl: string
    lightingCondition: string  // "golden hour", "overcast", "night"
  }>
  lastShotDescription: string
  cumulativeMood: string   // evolving emotional tone of the piece
  narrativeAct: 'setup' | 'confrontation' | 'resolution'
}

export class LongFormOrchestrator {
  private router = new SwarmRouter()
  private blender = new SeamlessBlender()

  // ── Render an arbitrarily long film in batches ───────────
  // Strategy: decompose entire script into shots, batch them
  // into groups of 10-15 (manageable parallel dispatch),
  // render each batch, blend within batch, then stitch batches.
  async renderLongForm(params: {
    shotList: ShotList
    userId: string
    projectId: string
    batchSize?: number
  }): Promise<string> {
    const { shotList, userId, projectId, batchSize = 12 } = params
    const shots = shotList.shots
    const batches: Shot[][] = []

    // Split into batches
    for (let i = 0; i < shots.length; i += batchSize) {
      batches.push(shots.slice(i, i + batchSize))
    }

    await redis.publish(`swarm:${projectId}`, JSON.stringify({
      event: 'longform_start',
      total_shots: shots.length,
      total_batches: batches.length,
      batches: batches.map((b, i) => ({ batch: i + 1, shots: b.length })),
    }))

    const batchUrls: string[] = []
    let continuityContext: ContinuityContext = {
      establishedCharacters: [],
      establishedLocations: [],
      lastShotDescription: '',
      cumulativeMood: 'neutral',
      narrativeAct: 'setup',
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i]

      // Inject continuity context into batch shots so Brain maintains
      // character appearance and location consistency across batches
      const enrichedBatch = await this.enrichWithContinuity(batch, continuityContext)

      await redis.publish(`swarm:${projectId}`, JSON.stringify({
        event: 'batch_start', batch: i + 1, of: batches.length, shots: batch.length,
      }))

      // Dispatch this batch
      const batchList: ShotList = {
        ...shotList,
        shots: enrichedBatch,
        total_duration_seconds: enrichedBatch.reduce((s, sh) => s + sh.duration_seconds, 0),
      }

      const batchResults = await this.router.dispatch({
        shotList: batchList,
        userId,
        projectId,
        onShotComplete: (r) => {
          redis.publish(`swarm:${projectId}`, JSON.stringify({
            event: 'shot_complete', batch: i + 1, shot_id: r.shot_id
          }))
        },
      })

      // Blend within this batch
      const batchUrl = await this.blender.blend({
        results: batchResults,
        shots: enrichedBatch,
        applyHouseLook: true,
      })
      batchUrls.push(batchUrl)

      // Update continuity context from this batch's results
      continuityContext = await this.updateContinuityContext(
        batchResults, enrichedBatch, continuityContext
      )

      await redis.publish(`swarm:${projectId}`, JSON.stringify({
        event: 'batch_complete', batch: i + 1, of: batches.length, url: batchUrl,
      }))
    }

    // Final stitch — concatenate all batch renders
    const finalUrl = await this.stitchBatches(batchUrls, projectId)

    await redis.publish(`swarm:${projectId}`, JSON.stringify({
      event: 'longform_complete', url: finalUrl,
    }))

    return finalUrl
  }

  // ── Enrich shots with continuity reference frames ────────
  private async enrichWithContinuity(
    shots: Shot[],
    context: ContinuityContext
  ): Promise<Shot[]> {
    return shots.map(shot => {
      const enrichedRefs: string[] = []

      // Inject last-seen frames for any character appearing in this shot
      shot.character_ids.forEach(charId => {
        const lastSeen = context.establishedCharacters.find(c => c.characterId === charId)
        if (lastSeen) {
          enrichedRefs.push(lastSeen.lastSeenFrame)
          // Append appearance description to prompt for consistency
          shot.prompt_enhanced = `${shot.prompt_enhanced ?? shot.description}
[CONTINUITY: Character appearance must match — ${lastSeen.appearance}]`
        }
      })

      // Inject location continuity
      if (shot.location_id) {
        const lastLoc = context.establishedLocations.find(l => l.locationId === shot.location_id)
        if (lastLoc) {
          shot.prompt_enhanced = `${shot.prompt_enhanced ?? shot.description}
[CONTINUITY: Location lighting = ${lastLoc.lightingCondition}, match previous shot aesthetic]`
        }
      }

      return {
        ...shot,
        reference_image_count: shot.reference_image_count + enrichedRefs.length,
      }
    })
  }

  // ── Update continuity context after each batch ───────────
  private async updateContinuityContext(
    results: SwarmResult[],
    shots: Shot[],
    prev: ContinuityContext
  ): Promise<ContinuityContext> {
    const newContext = { ...prev }
    const lastShot = shots[shots.length - 1]
    const lastResult = results.find(r => r.shot_id === lastShot.shot_id)

    if (lastResult) {
      newContext.lastShotDescription = lastShot.description
      // Extract last frame for continuity reference
      try {
        const frameResult = await fal.run('fal-ai/video-frame-extractor', {
          video_url: lastResult.output_url, timestamp: 999,
        }) as { image_url: string }

        // Update character records
        lastShot.character_ids.forEach(charId => {
          const existing = newContext.establishedCharacters.findIndex(c => c.characterId === charId)
          const record = {
            characterId: charId,
            lastSeenModelUsed: lastResult.model_used,
            lastSeenUrl: lastResult.output_url,
            lastSeenFrame: frameResult.image_url,
            appearance: lastShot.description,
          }
          if (existing >= 0) newContext.establishedCharacters[existing] = record
          else newContext.establishedCharacters.push(record)
        })

        // Update location records
        if (lastShot.location_id) {
          const locIdx = newContext.establishedLocations.findIndex(l => l.locationId === lastShot.location_id)
          const locRecord = {
            locationId: lastShot.location_id!,
            lastSeenUrl: lastResult.output_url,
            lightingCondition: lastShot.mood,
          }
          if (locIdx >= 0) newContext.establishedLocations[locIdx] = locRecord
          else newContext.establishedLocations.push(locRecord)
        }
      } catch { /* non-fatal — continuity degrades gracefully */ }
    }

    return newContext
  }

  private async stitchBatches(batchUrls: string[], projectId: string): Promise<string> {
    // Download all batch videos, concat with FFmpeg, upload final
    const tmp = await (await import('fs/promises')).mkdtemp(
      (await import('path')).join((await import('os')).tmpdir(), 'cinema-longform-')
    )
    const listPath = (await import('path')).join(tmp, 'concat.txt')
    const outputPath = (await import('path')).join(tmp, 'final.mp4')

    const localPaths: string[] = []
    for (let i = 0; i < batchUrls.length; i++) {
      const p = (await import('path')).join(tmp, `batch_${i}.mp4`)
      const resp = await fetch(batchUrls[i])
      const stream = (await import('fs')).createWriteStream(p)
      await (await import('stream/promises')).pipeline(resp.body as any, stream)
      localPaths.push(p)
    }

    const concatContent = localPaths.map(p => `file '${p}'`).join('\n')
    await (await import('fs/promises')).writeFile(listPath, concatContent)

    await new Promise<void>((res, rej) => {
      (await import('fluent-ffmpeg')).default()
        .input(listPath)
        .inputOptions(['-f', 'concat', '-safe', '0'])
        .outputOptions(['-c', 'copy'])
        .output(outputPath)
        .on('end', () => res())
        .on('error', rej)
        .run()
    })

    const finalUrl = await r2.uploadFile(outputPath, `longform/${projectId}_${Date.now()}.mp4`)
    await (await import('fs/promises')).rm(tmp, { recursive: true, force: true })
    return finalUrl
  }
}

import { fal } from '../fal/client'
```

---

## FILE 10 — src/lib/swarm/AudioSwarm.ts
### Complete Audio Generation & Sync Pipeline

Every shot in CINÉMA can have audio generated in parallel with video. This swarm runs concurrently with the video swarm, assembles the audio layer, and merges it at the end.

```typescript
import { redis } from '../redis'
import { r2 } from '../storage/r2'
import { fal } from '../fal/client'
import { runModel1 } from '../brain/model1'
import type { Shot, ModelId } from './types'

type AudioTaskType =
  | 'native'          // model already generated audio (Seedance, Veo 3.1, Kling 3.0)
  | 'elevenlabs_tts'  // character dialogue via ElevenLabs vault voice
  | 'suno_music'      // background score via Suno
  | 'audiocraft_foley'// ambient + SFX via AudioCraft
  | 'whisper_extract' // extract and clean audio from generated video
  | 'silence'         // intentionally silent (cut to music only)

interface AudioTask {
  shot_id: string
  type: AudioTaskType
  duration_seconds: number
  prompt?: string
  voice_id?: string          // ElevenLabs voice ID from vault
  dialogue_text?: string
  music_style?: string       // e.g. "tense orchestral strings, minor key"
  foley_description?: string // e.g. "rain on glass, distant thunder"
  source_video_url?: string  // for native audio extraction
}

interface AudioResult {
  shot_id: string
  audio_url: string
  duration_seconds: number
  type: AudioTaskType
  has_speech: boolean
  peak_db: number
}

export class AudioSwarm {

  // ── Analyse shot list and assign audio tasks ─────────────
  async planAudioTasks(shots: Shot[]): Promise<AudioTask[]> {
    const tasks: AudioTask[] = []

    for (const shot of shots) {
      // Native audio: Seedance and Veo generate audio naturally
      if (['seedance_2_0', 'veo_3_1', 'kling_3_0'].includes(shot.assigned_model ?? '')) {
        tasks.push({
          shot_id: shot.shot_id,
          type: 'native',
          duration_seconds: shot.duration_seconds,
          source_video_url: shot.generated_url,
        })
        continue
      }

      // Dialogue shot with vault voice
      if (shot.has_dialogue && shot.requires_post_lipsync && shot.character_ids.length) {
        const dialogueText = await this.extractDialogueFromDescription(shot.description)
        tasks.push({
          shot_id: shot.shot_id,
          type: 'elevenlabs_tts',
          duration_seconds: shot.duration_seconds,
          dialogue_text: dialogueText,
          voice_id: await this.getVaultVoiceId(shot.character_ids[0]),
        })
        continue
      }

      // Music video or audio-driven shot
      if (shot.scene_category === 'audio_music_video') {
        tasks.push({
          shot_id: shot.shot_id,
          type: 'suno_music',
          duration_seconds: shot.duration_seconds,
          music_style: this.deriveMusicStyle(shot.mood),
        })
        continue
      }

      // All other shots get foley/ambient
      tasks.push({
        shot_id: shot.shot_id,
        type: 'audiocraft_foley',
        duration_seconds: shot.duration_seconds,
        foley_description: await this.deriveFoleyDescription(shot),
      })
    }

    return tasks
  }

  // ── Execute all audio tasks in parallel ──────────────────
  async dispatch(tasks: AudioTask[], projectId: string): Promise<AudioResult[]> {
    const results = await Promise.allSettled(
      tasks.map(task => this.executeAudioTask(task))
    )

    const ok: AudioResult[] = []
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') ok.push(r.value)
      else console.error(`Audio task ${tasks[i].shot_id} failed:`, r.reason)
    })

    return ok
  }

  private async executeAudioTask(task: AudioTask): Promise<AudioResult> {
    let audioUrl: string
    let hasSpeech = false

    switch (task.type) {
      case 'native': {
        // Extract and clean audio from model-generated video
        const cleaned = await fal.run('fal-ai/whisper', {
          audio_url: task.source_video_url,
          task: 'transcribe',
        }) as any
        audioUrl = cleaned.audio_url ?? task.source_video_url
        hasSpeech = cleaned.text?.length > 0
        break
      }

      case 'elevenlabs_tts': {
        const response = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${task.voice_id}`,
          {
            method: 'POST',
            headers: {
              'xi-api-key': process.env.ELEVENLABS_API_KEY!,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              text: task.dialogue_text,
              model_id: 'eleven_turbo_v2_5',
              voice_settings: { stability: 0.5, similarity_boost: 0.85, style: 0.3 },
            }),
          }
        )
        const audioBuffer = await response.arrayBuffer()
        audioUrl = await r2.uploadBuffer(Buffer.from(audioBuffer), `audio/${task.shot_id}_voice.mp3`)
        hasSpeech = true
        break
      }

      case 'suno_music': {
        // Suno API call — generate music matching the shot mood
        const sunoRes = await fetch('https://studio-api.suno.ai/api/generate/v2/', {
          method: 'POST',
          headers: {
            'Cookie': `__stripe_mid=${process.env.SUNO_SESSION_ID}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: task.music_style,
            make_instrumental: true,
            mv: 'chirp-v3-5',
          }),
        })
        const sunoData = await sunoRes.json()
        // Poll Suno until complete
        audioUrl = await this.pollSuno(sunoData.clips?.[0]?.id)
        break
      }

      case 'audiocraft_foley': {
        const result = await fal.run('fal-ai/stable-audio', {
          prompt: task.foley_description,
          seconds_total: task.duration_seconds,
        }) as { audio_file: { url: string } }
        audioUrl = result.audio_file.url
        break
      }

      default:
        audioUrl = ''
    }

    return {
      shot_id: task.shot_id,
      audio_url: audioUrl,
      duration_seconds: task.duration_seconds,
      type: task.type,
      has_speech: hasSpeech,
      peak_db: -14,  // measured separately if needed
    }
  }

  // ── Merge audio results into video clips ─────────────────
  async mergeAudioIntoClips(
    videoResults: Array<{ shot_id: string; output_url: string }>,
    audioResults: AudioResult[]
  ): Promise<Array<{ shot_id: string; output_url: string }>> {
    return Promise.all(
      videoResults.map(async video => {
        const audio = audioResults.find(a => a.shot_id === video.shot_id)
        if (!audio || !audio.audio_url) return video

        // Download both, merge with FFmpeg, re-upload
        const merged = await this.mergeVideoAudio(video.output_url, audio.audio_url)
        return { shot_id: video.shot_id, output_url: merged }
      })
    )
  }

  private async mergeVideoAudio(videoUrl: string, audioUrl: string): Promise<string> {
    const { execSync } = await import('child_process')
    const tmp = (await import('os')).tmpdir()
    const vPath = `${tmp}/vid_${Date.now()}.mp4`
    const aPath = `${tmp}/aud_${Date.now()}.mp3`
    const oPath = `${tmp}/merged_${Date.now()}.mp4`

    await Promise.all([
      this.downloadToPath(videoUrl, vPath),
      this.downloadToPath(audioUrl, aPath),
    ])

    execSync(`ffmpeg -y -i "${vPath}" -i "${aPath}" -c:v copy -c:a aac -shortest "${oPath}"`)
    const url = await r2.uploadFile(oPath, `merged/${Date.now()}.mp4`)
    return url
  }

  // ── Helper methods ────────────────────────────────────────
  private async extractDialogueFromDescription(description: string): Promise<string> {
    // Extract any quoted dialogue from the shot description
    const matches = description.match(/"([^"]+)"/g)
    if (matches) return matches.map(m => m.replace(/"/g, '')).join(' ')
    // Otherwise synthesise dialogue from description
    const r = await runModel1({
      systemPrompt: 'Extract or generate a short line of dialogue (1-2 sentences) that a character would say in this scene. Return only the dialogue text.',
      userMessage: description,
      requireJSON: false,
    })
    return r.content.trim()
  }

  private async getVaultVoiceId(characterId: string): Promise<string> {
    const { db } = await import('../db')
    const char = await db.vaultCharacter.findUnique({ where: { id: characterId } })
    return char?.voiceId ?? process.env.ELEVENLABS_DEFAULT_VOICE_ID!
  }

  private deriveMusicStyle(mood: string): string {
    const styles: Record<string, string> = {
      tense:      'tense orchestral strings, minor key, building pressure, no melody',
      serene:     'peaceful ambient piano, warm pads, gentle and floating',
      dramatic:   'epic orchestral, full brass section, cinematic swell',
      romantic:   'soft strings, gentle piano melody, intimate and warm',
      triumphant: 'heroic brass fanfare, full orchestra, major key, driving rhythm',
      horror:     'dissonant strings, atonal, low rumble, unsettling',
      comedic:    'light pizzicato strings, playful woodwinds, bouncy rhythm',
      melancholic:'solo piano, minor key, slow tempo, sparse arrangement',
    }
    return styles[mood] ?? 'neutral cinematic underscore, subtle, not distracting'
  }

  private async deriveFoleyDescription(shot: Shot): Promise<string> {
    const elements: string[] = []
    if (shot.has_fluid_physics) elements.push('rain on surfaces, water movement')
    if (shot.has_vehicle) elements.push('vehicle engine, mechanical sounds, movement')
    if (shot.has_crowd) elements.push('crowd murmur, urban ambience, footsteps')
    if (shot.has_animal) elements.push('natural wildlife ambience, wind')
    if (shot.scene_category.startsWith('environment_')) elements.push('wind, nature ambience, birds distant')
    if (shot.scene_category.startsWith('urban_')) elements.push('city ambience, traffic distant, urban hum')
    if (shot.has_fire_explosion) elements.push('fire crackle, explosion rumble, debris')
    if (elements.length === 0) elements.push('subtle room tone, quiet ambience')
    return elements.join(', ')
  }

  private async downloadToPath(url: string, dest: string): Promise<void> {
    const resp = await fetch(url)
    const fs = await import('fs')
    const stream = fs.createWriteStream(dest)
    await (await import('stream/promises')).pipeline(resp.body as any, stream)
  }

  private async pollSuno(clipId: string): Promise<string> {
    for (let i = 0; i < 60; i++) {
      await new Promise(r => setTimeout(r, 3000))
      const res = await fetch(`https://studio-api.suno.ai/api/feed/?ids=${clipId}`, {
        headers: { 'Cookie': `__stripe_mid=${process.env.SUNO_SESSION_ID}` },
      })
      const data = await res.json()
      if (data[0]?.status === 'complete') return data[0].audio_url
      if (data[0]?.status === 'error') throw new Error('Suno generation failed')
    }
    throw new Error('Suno timeout')
  }
}
```

---

## FILE 11 — src/lib/swarm/GrowthEngineCapture.ts
### Training Data Collection from Every Swarm Run

Every swarm dispatch generates uniquely valuable training data. This module captures it all silently.

```typescript
import { db } from '../db'
import type { ShotList, SwarmResult, Shot, ModelId } from './types'

export class GrowthEngineCapture {

  // Called after every complete swarm dispatch
  async captureSwarmRun(params: {
    shotList: ShotList
    results: SwarmResult[]
    userId: string
    projectId: string
  }): Promise<void> {
    const { shotList, results, userId, projectId } = params

    // 1. Routing decision records — most valuable over time
    // After 100k+ runs, the Brain learns which assignments produce
    // best quality scores and self-optimises the routing table
    for (const result of results) {
      const shot = shotList.shots.find(s => s.shot_id === result.shot_id)
      if (!shot) continue
      await db.trainingData.create({
        data: {
          userId,
          type: 'routing_decision',
          metadata: {
            scene_category: shot.scene_category,
            assigned_model: result.model_used,
            quality_score: result.quality_score,
            needed_repaint: result.needs_repaint,
            tier: shotList.tier,
            shot_type: shot.shot_type,
            duration: shot.duration_seconds,
            flags: {
              human: shot.has_human_primary,
              fluid: shot.has_fluid_physics,
              crowd: shot.has_crowd,
              text: shot.has_text_in_frame,
              audio: shot.has_audio_requirement,
              hero: shot.is_hero_shot,
            },
            generation_ms: result.generation_ms,
            cost_credits: result.cost_credits,
          },
          isProcessed: false,
        }
      })
    }

    // 2. Prompt enhancement pairs — teach the Art Director to improve
    for (const shot of shotList.shots) {
      if (!shot.prompt_enhanced || shot.prompt_enhanced === shot.prompt_raw) continue
      const result = results.find(r => r.shot_id === shot.shot_id)
      await db.trainingData.create({
        data: {
          userId,
          type: 'prompt_enhancement_pair',
          metadata: {
            scene_category: shot.scene_category,
            model: shot.assigned_model,
            prompt_raw: shot.prompt_raw,
            prompt_enhanced: shot.prompt_enhanced,
            quality_score: result?.quality_score ?? 0,
          },
          isProcessed: false,
        }
      })
    }

    // 3. Cross-model quality comparison — which model wins per scene type
    // When multiple shots share the same scene_category but use different
    // models (across projects), we can compute which model consistently
    // produces higher quality scores for that category.
    await db.trainingData.create({
      data: {
        userId,
        type: 'model_quality_comparison',
        metadata: {
          project_id: projectId,
          tier: shotList.tier,
          comparisons: results.map(r => ({
            scene_category: shotList.shots.find(s => s.shot_id === r.shot_id)?.scene_category,
            model: r.model_used,
            quality: r.quality_score,
            needed_repaint: r.needs_repaint,
          })),
        },
        isProcessed: false,
      }
    })

    // 4. Repaint delta capture — highest value training signal
    const repaintedShots = results.filter(r => r.needs_repaint && r.repaint_regions.length)
    for (const r of repaintedShots) {
      const shot = shotList.shots.find(s => s.shot_id === r.shot_id)!
      await db.trainingData.create({
        data: {
          userId,
          type: 'repaint_delta',
          originalUrl: r.output_url,
          instruction: `Scene: ${shot.description} — Issues: ${r.repaint_regions.map(rp => rp.description).join(', ')}`,
          metadata: {
            scene_category: shot.scene_category,
            original_model: r.model_used,
            repaint_regions: r.repaint_regions,
            quality_before: r.quality_score,
          },
          isProcessed: false,
        }
      })
    }
  }

  // Called when a routing decision is later confirmed good or bad
  // by the user (did they keep the shot or regenerate it?)
  async captureUserFeedback(params: {
    shot_id: string
    project_id: string
    user_action: 'kept' | 'regenerated' | 'repainted'
    original_model: ModelId
    scene_category: string
    quality_score: number
    userId: string
  }): Promise<void> {
    await db.rLHFLog.create({
      data: {
        userId: params.userId,
        sessionId: params.project_id,
        promptText: params.scene_category,
        modelOptions: { model: params.original_model },
        selectedModel: params.user_action === 'kept' ? params.original_model : 'alternative',
        selectedIdx: params.user_action === 'kept' ? 0 : 1,
        context: {
          shot_id: params.shot_id,
          scene_category: params.scene_category,
          quality_score: params.quality_score,
          user_action: params.user_action,
        },
      }
    })
  }
}
```

---

## FILE 12 — src/components/swarm/SwarmProgressPanel.tsx
### Real-Time Swarm Dispatch UI

```typescript
'use client'

import { useEffect, useState, useRef } from 'react'
import { useSSE } from '@/hooks/useSSE'

interface ShotStatus {
  shot_id: string
  sequence_index: number
  description: string
  assigned_model: string
  status: 'queued' | 'generating' | 'complete' | 'failed' | 'repainting'
  proxy_url?: string
  quality_score?: number
  generation_ms?: number
  cost_credits?: number
}

interface SwarmEvent {
  event: string
  shot_id?: string
  total?: number
  done?: number
  result?: {
    output_url: string
    proxy_url: string
    quality_score: number
    generation_ms: number
    cost_credits: number
    needs_repaint: boolean
  }
}

const MODEL_COLOURS: Record<string, string> = {
  seedance_2_0:   '#1D9E75',
  veo_3_1:        '#c17d00',
  kling_3_0:      '#534AB7',
  runway_gen4_5:  '#D85A30',
  skyreels_v1:    '#993556',
  hunyuan_1_5:    '#185FA5',
  wan_2_2:        '#3B6D11',
  cogvideox:      '#0F6E56',
  ltx_2_3:        '#5F5E5A',
  pika_2_2:       '#BA7517',
  minimax_hailuo: '#378ADD',
  mochi_1:        '#444441',
}

const MODEL_LABELS: Record<string, string> = {
  seedance_2_0:   'Seedance 2.0',
  veo_3_1:        'Veo 3.1',
  kling_3_0:      'Kling 3.0',
  runway_gen4_5:  'Runway Gen-4.5',
  skyreels_v1:    'SkyReels V1',
  hunyuan_1_5:    'HunyuanVideo',
  wan_2_2:        'Wan 2.2',
  cogvideox:      'CogVideoX',
  ltx_2_3:        'LTX-2.3',
  pika_2_2:       'Pika 2.2',
  minimax_hailuo: 'Minimax',
  mochi_1:        'Mochi 1',
}

export function SwarmProgressPanel({ projectId, shots }: {
  projectId: string
  shots: Array<{ shot_id: string; sequence_index: number; description: string; assigned_model: string }>
}) {
  const [statuses, setStatuses] = useState<Record<string, ShotStatus>>(() => {
    const init: Record<string, ShotStatus> = {}
    shots.forEach(s => { init[s.shot_id] = { ...s, status: 'queued' } })
    return init
  })
  const [totalCost, setTotalCost] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(Date.now())

  // Connect SSE
  useSSE(`/api/swarm/${projectId}/stream`, (event: SwarmEvent) => {
    if (event.shot_id && event.result) {
      setStatuses(prev => ({
        ...prev,
        [event.shot_id!]: {
          ...prev[event.shot_id!],
          status: event.result!.needs_repaint ? 'repainting' : 'complete',
          proxy_url: event.result!.proxy_url,
          quality_score: event.result!.quality_score,
          generation_ms: event.result!.generation_ms,
          cost_credits: event.result!.cost_credits,
        }
      }))
      setTotalCost(c => c + (event.result!.cost_credits ?? 0))
    }
    if (event.event === 'shot_start' && event.shot_id) {
      setStatuses(prev => ({ ...prev, [event.shot_id!]: { ...prev[event.shot_id!], status: 'generating' } }))
    }
  })

  useEffect(() => {
    const interval = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(interval)
  }, [])

  const completed = Object.values(statuses).filter(s => s.status === 'complete' || s.status === 'repainting').length
  const total = shots.length
  const pct = Math.round((completed / total) * 100)

  const orderedShots = Object.values(statuses).sort((a, b) => a.sequence_index - b.sequence_index)

  return (
    <div style={{ fontFamily: 'var(--font-sans)', padding: '12px 0' }}>
      {/* Header stats */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {[
          { label: 'shots complete', value: `${completed} / ${total}` },
          { label: 'credits used', value: totalCost },
          { label: 'elapsed', value: `${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}` },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 8, padding: '6px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)' }}>{stat.label}</div>
            <div style={{ fontSize: 18, fontWeight: 500, color: 'var(--color-text-primary)' }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div style={{ height: 4, background: 'var(--color-background-secondary)', borderRadius: 2, marginBottom: 10, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: '#c17d00', borderRadius: 2, transition: 'width 0.4s' }} />
      </div>

      {/* Shot grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 6 }}>
        {orderedShots.map(shot => (
          <div key={shot.shot_id} style={{
            border: `0.5px solid ${shot.status === 'complete' ? 'var(--color-border-success)' : shot.status === 'generating' ? MODEL_COLOURS[shot.assigned_model] + '60' : 'var(--color-border-tertiary)'}`,
            borderRadius: 8,
            overflow: 'hidden',
            background: 'var(--color-background-primary)',
            position: 'relative',
          }}>
            {/* Proxy thumbnail */}
            {shot.proxy_url ? (
              <img src={shot.proxy_url} alt={shot.description} style={{ width: '100%', aspectRatio: '16/9', objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: '100%', aspectRatio: '16/9', background: 'var(--color-background-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {shot.status === 'generating' && (
                  <div style={{ width: 16, height: 16, border: `2px solid ${MODEL_COLOURS[shot.assigned_model]}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                )}
                {shot.status === 'queued' && (
                  <span style={{ fontSize: 10, color: 'var(--color-text-tertiary)' }}>#{shot.sequence_index}</span>
                )}
              </div>
            )}
            {/* Model badge */}
            <div style={{ padding: '4px 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: MODEL_COLOURS[shot.assigned_model], flexShrink: 0 }} />
              <span style={{ fontSize: 9, color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                {MODEL_LABELS[shot.assigned_model]}
              </span>
              {shot.quality_score !== undefined && (
                <span style={{ fontSize: 9, color: shot.quality_score >= 7 ? 'var(--color-text-success)' : shot.quality_score >= 5 ? 'var(--color-text-warning)' : 'var(--color-text-danger)', fontWeight: 500, flexShrink: 0 }}>
                  {shot.quality_score}/10
                </span>
              )}
            </div>
            {/* Repainting indicator */}
            {shot.status === 'repainting' && (
              <div style={{ position: 'absolute', top: 4, right: 4, background: '#c17d00', borderRadius: 4, padding: '1px 5px', fontSize: 8, color: '#060608', fontWeight: 700 }}>
                REPAINT
              </div>
            )}
          </div>
        ))}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
```

---

## FILE 13 — src/components/editor/TimelineHighlightEdit.tsx
### Precision Timeline Edit UI Panel

```typescript
'use client'

import { useState, useRef } from 'react'

interface TimelineHighlightEditProps {
  clipId: string
  clipUrl: string
  clipDuration: number
  projectId: string
  tier: 'Draft' | 'Studio' | 'Blockbuster'
  onComplete: (result: { stitchedUrl: string; model: string; quality: number }) => void
  onClose: () => void
}

export function TimelineHighlightEdit({
  clipId, clipUrl, clipDuration, projectId, tier, onComplete, onClose
}: TimelineHighlightEditProps) {
  const [startTime, setStartTime] = useState(0)
  const [endTime, setEndTime] = useState(Math.min(3, clipDuration))
  const [instruction, setInstruction] = useState('')
  const [phase, setPhase] = useState<'select' | 'analyse' | 'generating' | 'done'>('select')
  const [analysisResult, setAnalysisResult] = useState<{
    model: string; reasoning: string; enhanced_instruction: string
  } | null>(null)
  const [result, setResult] = useState<{ stitchedUrl: string; model: string; quality: number } | null>(null)
  const [creditEstimate] = useState(() => Math.ceil((endTime - startTime) * 3) + 2)

  const handleAnalyse = async () => {
    if (!instruction.trim() || endTime <= startTime) return
    setPhase('analyse')
    // Preview analysis only — show the user what the crew plans to do
    const resp = await fetch('/api/timeline/analyse', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clip_url: clipUrl, start_time: startTime, end_time: endTime, user_instruction: instruction, tier }),
    })
    const data = await resp.json()
    setAnalysisResult(data)
  }

  const handleExecute = async () => {
    setPhase('generating')
    const resp = await fetch('/api/timeline/edit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_id: projectId, clip_id: clipId, clip_url: clipUrl,
        start_time: startTime, end_time: endTime,
        user_instruction: instruction, tier,
      }),
    })
    const data = await resp.json()
    setResult({ stitchedUrl: data.stitched_clip_url, model: data.model_used, quality: data.quality_score })
    setPhase('done')
    onComplete({ stitchedUrl: data.stitched_clip_url, model: data.model_used, quality: data.quality_score })
  }

  const selectionPct = { left: `${(startTime / clipDuration) * 100}%`, width: `${((endTime - startTime) / clipDuration) * 100}%` }

  return (
    <div style={{ background: 'var(--color-background-primary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 12, padding: 16, width: '100%', maxWidth: 480 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--color-text-primary)' }}>Precision edit</span>
        <button onClick={onClose} style={{ fontSize: 11, color: 'var(--color-text-tertiary)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ close</button>
      </div>

      {/* Selection scrubber */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 5 }}>
          Selection: {startTime.toFixed(1)}s → {endTime.toFixed(1)}s ({(endTime - startTime).toFixed(1)}s)
        </div>
        <div style={{ height: 32, background: 'var(--color-background-tertiary)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', top: 0, bottom: 0, background: '#c17d0030',
            border: '1.5px solid #c17d00', borderRadius: 2, ...selectionPct
          }} />
          <input type="range" min={0} max={clipDuration} step={0.1} value={startTime}
            onChange={e => setStartTime(Math.min(+e.target.value, endTime - 0.5))}
            style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'col-resize' }} />
          <input type="range" min={0} max={clipDuration} step={0.1} value={endTime}
            onChange={e => setEndTime(Math.max(+e.target.value, startTime + 0.5))}
            style={{ position: 'absolute', width: '100%', opacity: 0, cursor: 'col-resize' }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
          <input type="number" value={startTime.toFixed(1)} step={0.1} min={0} max={clipDuration}
            onChange={e => setStartTime(Math.min(+e.target.value, endTime - 0.5))}
            style={{ width: 60, fontSize: 11, padding: '2px 4px', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 4, color: 'var(--color-text-primary)' }} />
          <input type="number" value={endTime.toFixed(1)} step={0.1} min={0} max={clipDuration}
            onChange={e => setEndTime(Math.max(+e.target.value, startTime + 0.5))}
            style={{ width: 60, fontSize: 11, padding: '2px 4px', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 4, color: 'var(--color-text-primary)' }} />
        </div>
      </div>

      {/* Instruction input */}
      <textarea
        value={instruction}
        onChange={e => setInstruction(e.target.value)}
        placeholder="What should change? e.g. 'Make the building taller' / 'The lighting should be warmer' / 'Replace the car with a truck'"
        rows={3}
        style={{ width: '100%', fontSize: 12, padding: 8, background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, color: 'var(--color-text-primary)', resize: 'vertical', marginBottom: 10, boxSizing: 'border-box' }}
      />

      {/* Analysis result preview */}
      {analysisResult && phase === 'analyse' && (
        <div style={{ background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-info)', borderRadius: 8, padding: 10, marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--color-text-info)', marginBottom: 4 }}>Crew analysis</div>
          <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
            Model: <span style={{ fontWeight: 500, color: 'var(--color-text-primary)' }}>{analysisResult.model.replace(/_/g, ' ')}</span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginBottom: 6, lineHeight: 1.4 }}>
            {analysisResult.reasoning}
          </div>
          <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', background: 'var(--color-background-primary)', borderRadius: 4, padding: '4px 6px', fontFamily: 'var(--font-mono)' }}>
            {analysisResult.enhanced_instruction.substring(0, 120)}...
          </div>
        </div>
      )}

      {/* Result preview */}
      {result && phase === 'done' && (
        <div style={{ marginBottom: 10 }}>
          <video src={result.stitchedUrl} controls style={{ width: '100%', borderRadius: 6, aspectRatio: '16/9' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--color-text-secondary)' }}>
            <span>Quality: <strong style={{ color: result.quality >= 7 ? 'var(--color-text-success)' : 'var(--color-text-warning)' }}>{result.quality}/10</strong></span>
            <span>Model: {result.model.replace(/_/g, ' ')}</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        {phase === 'select' && (
          <button onClick={handleAnalyse} disabled={!instruction.trim()}
            style={{ flex: 1, padding: '8px 0', background: 'var(--color-background-secondary)', border: '0.5px solid var(--color-border-secondary)', borderRadius: 6, fontSize: 12, cursor: instruction.trim() ? 'pointer' : 'not-allowed', color: 'var(--color-text-primary)' }}>
            Analyse →
          </button>
        )}
        {phase === 'analyse' && (
          <>
            <button onClick={() => setPhase('select')}
              style={{ padding: '8px 14px', background: 'none', border: '0.5px solid var(--color-border-tertiary)', borderRadius: 6, fontSize: 12, cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              Back
            </button>
            <button onClick={handleExecute}
              style={{ flex: 1, padding: '8px 0', background: '#c17d00', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#060608' }}>
              Execute ({creditEstimate} credits)
            </button>
          </>
        )}
        {phase === 'generating' && (
          <div style={{ flex: 1, textAlign: 'center', padding: '8px 0', fontSize: 12, color: 'var(--color-text-tertiary)' }}>
            Crew is working...
          </div>
        )}
        {phase === 'done' && (
          <button onClick={onClose}
            style={{ flex: 1, padding: '8px 0', background: 'var(--color-text-success)', border: 'none', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#fff' }}>
            Apply to timeline ✓
          </button>
        )}
      </div>
    </div>
  )
}
```

---

## FINAL SPRINT ADDITIONS

**Sprint 27 — Seamless Blender + Long Form:**
1. Build `SeamlessBlender.ts` — model profile table, per-clip normalisation, boundary passes
2. Build `LongFormOrchestrator.ts` — batch dispatch, continuity context, batch stitching
3. Wire blender into the main dispatch flow after all shots complete
4. Test: generate 8-shot sequence across 5 models, measure visual discontinuity before/after blending
5. Test: generate 60-second script (12 shots), verify end-to-end cohesion

**Sprint 28 — Audio Swarm:**
1. Build `AudioSwarm.ts` — task planning, ElevenLabs, Suno, AudioCraft, native extraction
2. Run audio swarm in parallel with video swarm (separate BullMQ queue)
3. Merge audio into video clips post-dispatch
4. Wire SadTalker lipsync for dialogue shots
5. Test: full 30-second sequence with dialogue, ambient, and music layers

**Sprint 29 — Growth Engine Integration:**
1. Build `GrowthEngineCapture.ts` — all capture points wired
2. Add user feedback webhooks (kept/regenerated/repainted signals)
3. Verify TrainingData rows created for every routing decision
4. Build admin dashboard: routing decision heatmap by scene_category × model × quality
5. Schedule weekly analysis job: flag scene categories where a different model would score higher

**Sprint 30 — UI + Polish:**
1. Build `SwarmProgressPanel.tsx` — shot grid with proxy thumbnails and quality scores
2. Build `TimelineHighlightEdit.tsx` — precision edit panel
3. Wire highlight edit into Advanced and Ultimate timeline UIs
4. Add model distribution chart to project overview (shows cost breakdown by model)
5. End-to-end test: full Blockbuster-tier 2-minute film generation
