import Anthropic from '@anthropic-ai/sdk'

export type EmotionType = 'tension' | 'joy' | 'sadness' | 'confusion' | 'resolution' | 'climax'
export type ArcPosition = 'build' | 'peak' | 'resolution' | 'transition'
export type OverallArc = 'rising' | 'falling' | 'circular' | 'broken' | 'flat'

export interface EmotionalBeat {
  clipId: string
  timestamp: number
  emotion: EmotionType
  intensity: number       // 0–10
  confidence: number      // 0–1
  drivingElement: string
  arcPosition: ArcPosition
}

export interface ThreeActStructure {
  act1End: number
  act2End: number
  act1Emotion: EmotionType
  act2Emotion: EmotionType
  act3Emotion: EmotionType
}

export interface NarrativePace {
  avgShotLength: number
  cutTension: number
  musicAlignment: number
  silenceRatio: number
  recommendations: {
    cutFaster: boolean
    addSilence: boolean
    increaseMusicProminence: boolean
    extendEmotionalMoments: boolean
  }
}

export interface WeakPoint {
  timestamp: number
  clipId: string
  issue: string
  suggestion: string
}

export interface EmotionLatticeResult {
  beats: EmotionalBeat[]
  overallArc: OverallArc
  threeActStructure: ThreeActStructure
  paceRecommendations: NarrativePace
  weakPoints: WeakPoint[]
}

export interface EmotionLatticeRequest {
  projectId: string
  userId: string
  clips: Array<{ id: string; prompt: string; duration: number; startTime: number }>
}

// ─── Type guards ──────────────────────────────────────────────────────────────

const EMOTION_TYPES = new Set<EmotionType>(['tension', 'joy', 'sadness', 'confusion', 'resolution', 'climax'])
const ARC_POSITIONS = new Set<ArcPosition>(['build', 'peak', 'resolution', 'transition'])
const OVERALL_ARCS = new Set<OverallArc>(['rising', 'falling', 'circular', 'broken', 'flat'])

function isEmotionType(v: unknown): v is EmotionType { return typeof v === 'string' && EMOTION_TYPES.has(v as EmotionType) }
function isArcPosition(v: unknown): v is ArcPosition { return typeof v === 'string' && ARC_POSITIONS.has(v as ArcPosition) }
function isOverallArc(v: unknown): v is OverallArc { return typeof v === 'string' && OVERALL_ARCS.has(v as OverallArc) }

function isEmotionalBeat(v: unknown): v is EmotionalBeat {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.clipId === 'string' && typeof o.timestamp === 'number' &&
    isEmotionType(o.emotion) && typeof o.intensity === 'number' &&
    typeof o.confidence === 'number' && typeof o.drivingElement === 'string' &&
    isArcPosition(o.arcPosition)
}

function isThreeActStructure(v: unknown): v is ThreeActStructure {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.act1End === 'number' && typeof o.act2End === 'number' &&
    isEmotionType(o.act1Emotion) && isEmotionType(o.act2Emotion) && isEmotionType(o.act3Emotion)
}

function isNarrativePace(v: unknown): v is NarrativePace {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  if (typeof o.avgShotLength !== 'number' || typeof o.cutTension !== 'number' ||
    typeof o.musicAlignment !== 'number' || typeof o.silenceRatio !== 'number') return false
  if (typeof o.recommendations !== 'object' || o.recommendations === null) return false
  const r = o.recommendations as Record<string, unknown>
  return typeof r.cutFaster === 'boolean' && typeof r.addSilence === 'boolean' &&
    typeof r.increaseMusicProminence === 'boolean' && typeof r.extendEmotionalMoments === 'boolean'
}

function isWeakPoint(v: unknown): v is WeakPoint {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return typeof o.timestamp === 'number' && typeof o.clipId === 'string' &&
    typeof o.issue === 'string' && typeof o.suggestion === 'string'
}

export function isEmotionLatticeResult(v: unknown): v is EmotionLatticeResult {
  if (typeof v !== 'object' || v === null) return false
  const o = v as Record<string, unknown>
  return Array.isArray(o.beats) && o.beats.every(isEmotionalBeat) &&
    isOverallArc(o.overallArc) && isThreeActStructure(o.threeActStructure) &&
    isNarrativePace(o.paceRecommendations) &&
    Array.isArray(o.weakPoints) && o.weakPoints.every(isWeakPoint)
}

// ─── SVG arc path ─────────────────────────────────────────────────────────────

export function computeArcPath(beats: EmotionalBeat[], totalWidth: number, height: number): string {
  if (beats.length === 0) return ''
  const totalTime = Math.max(...beats.map((b) => b.timestamp), 1)

  const points = beats.map((b) => ({
    x: (b.timestamp / totalTime) * totalWidth,
    y: height - (b.intensity / 10) * height,
  }))

  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`

  // Catmull-Rom to cubic bezier
  let path = `M ${points[0].x} ${points[0].y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(i + 2, points.length - 1)]
    const cp1x = p1.x + (p2.x - p0.x) / 6
    const cp1y = p1.y + (p2.y - p0.y) / 6
    const cp2x = p2.x - (p3.x - p1.x) / 6
    const cp2y = p2.y - (p3.y - p1.y) / 6
    path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`
  }
  return path
}

// ─── Emotion color ────────────────────────────────────────────────────────────

export const EMOTION_COLORS: Record<EmotionType, string> = {
  tension: '#ef4444', joy: '#22c55e', sadness: '#3b82f6',
  confusion: '#f97316', resolution: '#00e5c8', climax: '#8b5cf6',
}

// ─── Main analysis ────────────────────────────────────────────────────────────

export async function analyzeEmotionalArc(req: EmotionLatticeRequest): Promise<EmotionLatticeResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
  if (req.clips.length < 3) throw new Error('At least 3 clips are required for emotional arc analysis')

  const totalDuration = req.clips.reduce((sum, c) => Math.max(sum, c.startTime + c.duration), 0)
  const clipInventory = req.clips
    .map((c, i) => `  ${i + 1}. id="${c.id}" | start=${c.startTime}s | dur=${c.duration}s | prompt="${c.prompt}"`)
    .join('\n')

  const systemPrompt = `You are a professional script analyst AI for Cinematic Forge video editor.
Analyse video clip sequences and produce emotional arc analysis in JSON.
Output ONLY valid JSON — no markdown, no text outside JSON.

Valid EmotionType values: "tension" | "joy" | "sadness" | "confusion" | "resolution" | "climax"
Valid ArcPosition values: "build" | "peak" | "resolution" | "transition"
Valid OverallArc values: "rising" | "falling" | "circular" | "broken" | "flat"

Ranges: intensity 0-10 integer, confidence 0.0-1.0, cutTension 0-10, musicAlignment 0-1, silenceRatio 0-1

OUTPUT SCHEMA:
{
  "beats": [{ "clipId": "string", "timestamp": 0, "emotion": "tension", "intensity": 7, "confidence": 0.85, "drivingElement": "string", "arcPosition": "build" }],
  "overallArc": "rising",
  "threeActStructure": { "act1End": 0, "act2End": 0, "act1Emotion": "tension", "act2Emotion": "climax", "act3Emotion": "resolution" },
  "paceRecommendations": { "avgShotLength": 5, "cutTension": 5, "musicAlignment": 0.7, "silenceRatio": 0.1, "recommendations": { "cutFaster": false, "addSilence": false, "increaseMusicProminence": false, "extendEmotionalMoments": false } },
  "weakPoints": [{ "timestamp": 0, "clipId": "string", "issue": "string", "suggestion": "string" }]
}`

  const userPrompt = `Project: ${req.projectId} | Duration: ${totalDuration.toFixed(1)}s | Clips: ${req.clips.length}

CLIP INVENTORY:
${clipInventory}

Analyse each clip's emotional content from its prompt. Map beats, 3-act structure, pacing, and weak points.
act1End should be at ~25% of total duration, act2End at ~75%.
Output ONLY the JSON object.`

  const client = new Anthropic({ apiKey })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  })

  const textBlock = response.content.find((b) => b.type === 'text')
  if (!textBlock || textBlock.type !== 'text') throw new Error('No text content from Anthropic')

  let jsonText = textBlock.text.trim()
  const fence = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fence) jsonText = fence[1].trim()

  let parsed: unknown
  try { parsed = JSON.parse(jsonText) } catch {
    throw new Error(`Failed to parse emotion analysis JSON. Raw: ${jsonText.slice(0, 400)}`)
  }

  if (!isEmotionLatticeResult(parsed)) {
    throw new Error('Emotion analysis response does not match schema')
  }

  // Validate all clipIds reference actual clips
  const validIds = new Set(req.clips.map((c) => c.id))
  for (const beat of parsed.beats) {
    if (!validIds.has(beat.clipId)) beat.clipId = req.clips[0]?.id ?? beat.clipId
  }

  // Clamp act boundaries
  const acts = parsed.threeActStructure
  parsed.threeActStructure.act1End = Math.min(acts.act1End, totalDuration * 0.45)
  parsed.threeActStructure.act2End = Math.min(Math.max(acts.act2End, acts.act1End + 1), totalDuration * 0.9)

  return parsed
}
