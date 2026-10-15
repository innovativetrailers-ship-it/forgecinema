import { z } from 'zod'

/**
 * Superset of the previous QA inspector fields.
 * quality_score, description_match, physics_accuracy, character_accuracy,
 * issues_found, needs_repaint, repaint_regions, and accept stay.
 * Scores are bands 1–5. Client validation clamps them; the schema does not.
 */

export const repaintRegionSchema = z.object({
  description: z.string(),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  start_time: z.number(),
  end_time: z.number(),
  repair_prompt: z.string(),
  suggested_repair_model: z.string(),
})

export const qaDefectSchema = z.object({
  category: z.string(),
  evidence: z.string(),
  frames: z.array(z.string()).optional(),
  t_start: z.number().optional(),
  t_end: z.number().optional(),
  present: z.boolean(),
  confirmed: z.boolean(),
  severity: z.string(),
  region: z.object({
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }).optional(),
})

export const qaOutputSchema = z.object({
  quality_score: z.number(),
  description_match: z.number(),
  physics_accuracy: z.number(),
  character_accuracy: z.number(),
  defects: z.array(qaDefectSchema).default([]),
  issues_found: z.array(z.string()).default([]),
  needs_repaint: z.boolean(),
  repaint_regions: z.array(repaintRegionSchema).default([]),
  accept: z.boolean(),
})

export type QaOutput = z.infer<typeof qaOutputSchema>
export type QaDefect = z.infer<typeof qaDefectSchema>

export const QA_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'quality_score',
    'description_match',
    'physics_accuracy',
    'character_accuracy',
    'defects',
    'issues_found',
    'needs_repaint',
    'repaint_regions',
    'accept',
  ],
  properties: {
    quality_score: { type: 'number' },
    description_match: { type: 'number' },
    physics_accuracy: { type: 'number' },
    character_accuracy: { type: 'number' },
    defects: { type: 'array' },
    issues_found: { type: 'array', items: { type: 'string' } },
    needs_repaint: { type: 'boolean' },
    repaint_regions: { type: 'array' },
    accept: { type: 'boolean' },
  },
} as const

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 1
  return Math.min(5, Math.max(1, Math.round(n)))
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0
  return Math.min(1, Math.max(0, n))
}

export interface QaValidation {
  ok: boolean
  value?: QaOutput
  issues: string[]
}

/** Clamp ranges. Reject zero-area boxes. A defect with no frame or time is unconfirmed. */
export function validateQaOutput(raw: unknown, clipDurationS?: number): QaValidation {
  const parsed = qaOutputSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((issue) => issue.message) }
  }
  const value: QaOutput = {
    ...parsed.data,
    quality_score: clampScore(parsed.data.quality_score),
    description_match: clampScore(parsed.data.description_match),
    physics_accuracy: clampScore(parsed.data.physics_accuracy),
    character_accuracy: clampScore(parsed.data.character_accuracy),
    defects: parsed.data.defects.map((defect) => ({ ...defect })),
    repaint_regions: parsed.data.repaint_regions.map((region) => ({ ...region })),
  }
  const issues: string[] = []
  const limit = clipDurationS != null && clipDurationS > 0 ? clipDurationS : null
  for (const defect of value.defects) {
    const hasFrame = (defect.frames?.length ?? 0) > 0
    const hasTime = defect.t_start != null || defect.t_end != null
    if (!hasFrame && !hasTime) defect.confirmed = false
    if (limit != null) {
      if (defect.t_start != null) defect.t_start = Math.min(limit, Math.max(0, defect.t_start))
      if (defect.t_end != null) defect.t_end = Math.min(limit, Math.max(0, defect.t_end))
    }
    if (defect.region) {
      defect.region = {
        x: clamp01(defect.region.x),
        y: clamp01(defect.region.y),
        w: clamp01(defect.region.w),
        h: clamp01(defect.region.h),
      }
      if (defect.region.w <= 0 || defect.region.h <= 0) {
        issues.push(`zero-area box on ${defect.category}`)
      }
    }
  }
  for (const region of value.repaint_regions) {
    region.x = clamp01(region.x)
    region.y = clamp01(region.y)
    region.width = clamp01(region.width)
    region.height = clamp01(region.height)
    if (limit != null) {
      region.start_time = Math.min(limit, Math.max(0, region.start_time))
      region.end_time = Math.min(limit, Math.max(0, region.end_time))
    }
    if (region.width <= 0 || region.height <= 0) issues.push('zero-area repaint region')
  }
  const confirmed = value.defects.some((defect) => defect.confirmed && defect.present)
  if (!confirmed) value.needs_repaint = false
  if (issues.length) return { ok: false, issues }
  return { ok: true, value, issues: [] }
}
