import { z } from 'zod'

/** Canonical shot spec. Technical fields are optional so the director can omit them. */

export const cameraSchema = z.object({
  size: z.string().min(1),
  angle: z.string().min(1),
  lens_mm: z.number(),
  move: z.string().min(1),
  pace: z.string().min(1),
})

export const dialogueLineSchema = z.object({
  speaker: z.string().min(1),
  voice: z.string().min(1),
  line: z.string().min(1),
})

export const shotSpecSchema = z.object({
  shot_id: z.string().min(1),
  duration_s: z.number().positive(),
  subject: z.string().min(1),
  action: z.string().min(1),
  setting: z.string().min(1),
  camera: cameraSchema.optional(),
  lighting: z.string().optional(),
  grade: z.string().optional(),
  audio: z.object({
    dialogue: z.array(dialogueLineSchema),
    sfx: z.array(z.string()),
    ambience: z.string(),
    music: z.boolean(),
  }),
  references: z.array(z.object({
    id: z.string().min(1),
    role: z.string().min(1),
  })),
  continuity: z.object({
    carries_from: z.string().nullable(),
    screen_direction: z.string(),
    props: z.array(z.string()),
  }),
  avoid: z.array(z.string()),
})

export type ShotSpec = z.infer<typeof shotSpecSchema>
export type CameraSpec = z.infer<typeof cameraSchema>

export const SHOT_SPEC_JSON_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['shot_id', 'duration_s', 'subject', 'action', 'setting', 'audio', 'references', 'continuity', 'avoid'],
  properties: {
    shot_id: { type: 'string' },
    duration_s: { type: 'number' },
    subject: { type: 'string' },
    action: { type: 'string' },
    setting: { type: 'string' },
    camera: {
      type: 'object',
      properties: {
        size: { type: 'string' },
        angle: { type: 'string' },
        lens_mm: { type: 'number' },
        move: { type: 'string' },
        pace: { type: 'string' },
      },
    },
    lighting: { type: 'string' },
    grade: { type: 'string' },
    audio: { type: 'object' },
    references: { type: 'array' },
    continuity: { type: 'object' },
    avoid: { type: 'array', items: { type: 'string' } },
  },
} as const
