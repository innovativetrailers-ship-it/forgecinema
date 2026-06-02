// src/lib/orchestration/types.ts

// Unified sub-progress callback — every vendor poller calls this
export interface SubProgress {
  pct:     number   // 0-100 within this single segment
  message: string   // human-readable status
  vendor:  string   // 'fal' | 'runway' | 'xai' | 'suno' | 'elevenlabs'
}

export type SubProgressFn = (p: SubProgress) => void

export type ContentType =
  | 'aerial_establishing'    // wide aerial, environments → Luma
  | 'dialogue_closeup'       // faces, dialogue, lip sync → Seedance
  | 'physical_action'        // locomotion, combat, sports → Kling
  | 'cgi_vfx'               // particles, fire, fluid sim → PixVerse C1
  | 'crowd_urban'            // multi-person, cityscape → HunyuanVideo
  | 'camera_control'         // complex moves, keyframes → Runway
  | 'physics_simulation'     // water, cloth, impact → Veo 3.1
  | 'character_emotion'      // micro-expressions, reaction → Minimax
  | 'cgi_character'          // 3D animation, walk cycles → HY-Motion
  | 'long_sequence'          // >15s continuous → SkyReels V3
  | 'fast_draft'             // pre-vis, speed check → LTX Fast
  | 'environment_travel'     // landscape, nature → Wan 2.2
  | 'product_commercial'     // product shots → Pika 2.5
  | 'audio_native'           // needs dialogue/audio sync → Veo 3.1 / Seedance

export interface PatientZeroAssets {
  characters: Array<{
    name:       string
    imageUrl:   string    // R2 URL of high-res reference
    embedUrl:   string    // same, used as IP-Adapter input
  }>
  locations: Array<{
    name:       string
    imageUrl:   string
  }>
}

export interface StructuredShot {
  shotIndex:         number
  startSeconds:      number
  endSeconds:        number
  duration:          number
  contentType:       ContentType
  visualPrompt:      string
  cameraMove:        string
  motionLevel:       'static' | 'slow' | 'medium' | 'fast' | 'complex'
  hasDialogue:       boolean
  hasFaces:          boolean
  hasAudio:          boolean
  hasCGI:            boolean
  charactersPresent: string[]
  locationsPresent:  string[]
  lighting:          string
  mood:              string
  bridgeRequired:    boolean
  suggestedModel?:   string
}

export interface DAGNode {
  shot:           StructuredShot
  assignedModel:  string
  dependencies:   number[]
  tailFrameUrl?:  string
  shotMemory:     string[]
  estimatedCost:  number
  priority:       'critical' | 'high' | 'normal'
}

export interface GeneratedSegment {
  shotIndex:    number
  videoUrl:     string
  duration:     number
  model:        string
  tailFrameUrl: string
  qualityScore: number
  retryCount:   number
}

export interface OrchestrationResult {
  segments:       GeneratedSegment[]
  finalVideoUrl:  string
  totalCredits:   number
  totalDuration:  number
  qualityScores:  Record<number, number>
  modelBreakdown: Record<string, { duration: number; cost: number; shots: number[] }>
  patientZero:    PatientZeroAssets
}
