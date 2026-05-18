import type { SceneCategory } from '../swarm/types'

export interface FailureMode {
  trigger: string
  manifestation: string
  frequency: number
  severity: 1 | 2 | 3 | 4 | 5
  workaround?: string
}

export interface PromptSensitivity {
  synonyms_matter: boolean
  order_matters: boolean
  detail_level_optimal: 'sparse' | 'medium' | 'dense'
  forbidden_words: string[]
  power_words: string[]
}

export interface PhysicsAssessment {
  rigid_body_score: number
  fluid_dynamics_score: number
  cloth_simulation_score: number
  notes: string
}

export interface MotionAssessment {
  human_biomechanics_score: number
  camera_control_score: number
  animal_motion_score: number
  temporal_consistency_score: number
  notes: string
}

export interface TextAssessment {
  legibility_score: number
  accuracy_score: number
  style_preservation_score: number
  notes: string
}

export interface CharacterAssessment {
  appearance_consistency_score: number
  face_quality_score: number
  expression_accuracy_score: number
  notes: string
}

export interface SpeedProfile {
  avg_generation_seconds: number
  draft_seconds: number
  studio_seconds: number
  blockbuster_seconds: number
}

export interface QualityDurationCurve {
  seconds_4_score: number
  seconds_8_score: number
  seconds_16_score: number
  notes: string
}

export interface ResolutionAnalysis {
  supports_720p: boolean
  supports_1080p: boolean
  supports_4k: boolean
  optimal_resolution: string
  stability_notes: string
}

export interface TrainingExample {
  probe_id: string
  prompt: string
  video_url: string
  quality_score: number
  category: string
  notes: string
}

export interface ModelIntelligenceReport {
  model_id: string
  model_version: string
  report_date: string
  generated_by: string

  strengths: string[]
  weaknesses: string[]
  failure_modes: FailureMode[]

  prompt_sensitivity: PromptSensitivity
  consistency_score: number
  physics_accuracy: PhysicsAssessment
  motion_quality: MotionAssessment
  text_rendering: TextAssessment
  character_fidelity: CharacterAssessment

  generation_speed_profile: SpeedProfile
  quality_vs_duration: QualityDurationCurve
  resolution_stability: ResolutionAnalysis

  optimal_scene_types: SceneCategory[]
  avoid_scene_types: SceneCategory[]
  cost_efficiency_rating: number

  training_examples: TrainingExample[]
  distillation_candidates: string[]
}

export interface RawProbeResult {
  probe_id: string
  category: string
  model_id: string
  model_version: string
  prompt: string
  probe_prompt: string
  video_url: string
  assessment: {
    quality_score: number
    issues: string[]
    strengths: string[]
    notes: string
  }
  generated_at: string
  generation_ms: number
}

export type RawProbeResults = RawProbeResult[]

export interface ModelUpdate {
  model_id: string
  previous_version: string
  new_version: string
  detected_at: string
}

export interface UpdateDelta {
  improved_categories: string[]
  degraded_categories: string[]
  significance_score: number
  summary: string
}

export interface ProbeSet {
  category: string
  probes: Array<{
    id: string
    prompt: string
    target: string
  }>
}
