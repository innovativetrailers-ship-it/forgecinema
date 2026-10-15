import { z } from 'zod'
import { logExpertBrief } from '../llm/routing'
import { qaBrief } from './roles/qa'
import { directorBrief } from './roles/director'
import { cinematographerBrief } from './roles/cinematographer'
import { colouristBrief } from './roles/colourist'
import { editorBrief } from './roles/editor'
import { soundBrief } from './roles/sound'
import { continuityBrief } from './roles/continuity'
import { shotSpecSchema, cameraSchema } from './shotSpec'
import { validateQaOutput, type QaOutput } from './qaSchema'

export const EXPERT_ROLES = [
  'director',
  'cinematographer',
  'colourist',
  'editor',
  'sound',
  'continuity',
  'qa',
] as const

export type ExpertRole = (typeof EXPERT_ROLES)[number]

export const ROLE_BRIEFS = {
  director: directorBrief,
  cinematographer: cinematographerBrief,
  colourist: colouristBrief,
  editor: editorBrief,
  sound: soundBrief,
  continuity: continuityBrief,
  qa: qaBrief,
} as const

const directorOutputSchema = z.object({
  scene_id: z.string().min(1),
  intent: z.string().min(1),
  shots: z.array(shotSpecSchema).min(1),
  coverage_notes: z.string(),
})

const cinematographerOutputSchema = z.object({
  shot: shotSpecSchema.extend({ camera: cameraSchema, lighting: z.string().min(1) }),
  risk: z.string().min(1),
})

const colouristOutputSchema = z.object({
  scene_id: z.string().min(1),
  grade: z.string().min(1),
  shot_adjustments: z.array(z.object({ shot_id: z.string(), grade: z.string() })),
})

const editorOutputSchema = z.object({
  timeline: z.array(z.object({
    shot_id: z.string(),
    in_s: z.number(),
    out_s: z.number(),
    transition: z.string(),
    audio_lead_s: z.number(),
  })).min(1),
  total_s: z.number(),
  pace_curve: z.string(),
  flagged_cuts: z.array(z.object({
    between: z.array(z.string()),
    rule_broken: z.string(),
    fix: z.string(),
  })),
})

const soundOutputSchema = z.object({
  shot_id: z.string().min(1),
  audio: shotSpecSchema.shape.audio,
  native_audio: z.boolean(),
  sound_plan: z.string().nullable(),
})

const continuityOutputSchema = z.object({
  shot_id: z.string().min(1),
  violations: z.array(z.object({
    type: z.string(),
    expected: z.string(),
    found: z.string(),
    severity: z.string(),
  })),
  pass: z.boolean(),
})

const OUTPUT_SCHEMAS = {
  director: directorOutputSchema,
  cinematographer: cinematographerOutputSchema,
  colourist: colouristOutputSchema,
  editor: editorOutputSchema,
  sound: soundOutputSchema,
  continuity: continuityOutputSchema,
} as const

export class ExpertOutputError extends Error {
  readonly role: ExpertRole
  readonly version: string
  readonly issues: string[]

  constructor(role: ExpertRole, version: string, issues: string[]) {
    super(`Expert output failed for ${role} ${version}: ${issues.join('; ')}`)
    this.name = 'ExpertOutputError'
    this.role = role
    this.version = version
    this.issues = issues
  }
}

export function validateRoleOutput(
  role: ExpertRole,
  raw: unknown,
  clipDurationS?: number,
): { ok: true; value: unknown } | { ok: false; issues: string[] } {
  if (role === 'qa') {
    const qa = validateQaOutput(raw, clipDurationS)
    return qa.ok && qa.value ? { ok: true, value: qa.value } : { ok: false, issues: qa.issues }
  }
  const parsed = OUTPUT_SCHEMAS[role].safeParse(raw)
  if (!parsed.success) {
    return { ok: false, issues: parsed.error.issues.map((issue) => `${issue.path.join('.') || 'output'}: ${issue.message}`) }
  }
  return { ok: true, value: parsed.data }
}

/**
 * One repair on the same route. The repair function is injected so tests
 * spend nothing. A second failure throws. Fields are never invented here.
 */
export async function acceptRoleOutput(
  role: ExpertRole,
  raw: unknown,
  repair: (issues: string[]) => Promise<unknown>,
  clipDurationS?: number,
): Promise<unknown> {
  const brief = ROLE_BRIEFS[role]
  logExpertBrief(role, brief.version)
  const first = validateRoleOutput(role, raw, clipDurationS)
  if (first.ok) return first.value
  console.warn('[expert_repair]', JSON.stringify({ role, version: brief.version, issues: first.issues }))
  let secondRaw: unknown
  try {
    secondRaw = await repair(first.issues)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new ExpertOutputError(role, brief.version, [...first.issues, message])
  }
  const second = validateRoleOutput(role, secondRaw, clipDurationS)
  if (second.ok) return second.value
  throw new ExpertOutputError(role, brief.version, second.issues)
}

export function composeRolePrompt(role: ExpertRole): string {
  const brief = ROLE_BRIEFS[role]
  return [
    `[expert ${role} ${brief.version}]`,
    brief.identity,
    `Scope: ${brief.scope}`,
    `Craft: ${brief.craft}`,
    `Output schema: ${JSON.stringify(brief.outputSchema)}`,
    `Failure modes: ${brief.failureModes}`,
    'Return only JSON that matches the schema. Do not add a field named reasoning. Use evidence.',
  ].join('\n\n')
}

export type { QaOutput }
