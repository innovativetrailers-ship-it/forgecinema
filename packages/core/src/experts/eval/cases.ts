import type { ShotSpec } from '../shotSpec'

export const KEEPER_SHOT: ShotSpec = {
  shot_id: 'S03-02',
  duration_s: 7,
  subject: 'weathered lighthouse keeper, grey beard, yellow oilskin',
  action: 'climbs the spiral stairs, stops, looks up at the lamp',
  setting: 'inside lighthouse tower, night, storm outside',
  camera: { size: 'medium', angle: 'low', lens_mm: 35, move: 'slow push-in', pace: 'slow' },
  lighting: 'single warm practical from above, cold blue spill from windows',
  grade: 'teal shadows, amber highlights, low saturation, soft contrast',
  audio: {
    dialogue: [{ speaker: 'KEEPER', voice: 'gravelly, low', line: "She's still burning." }],
    sfx: ['boots on iron steps', 'wind through gaps'],
    ambience: 'storm, distant waves',
    music: false,
  },
  references: [{ id: 'img_keeper_01', role: 'character identity' }],
  continuity: { carries_from: 'S03-01', screen_direction: 'left-to-right', props: ['oil lantern in right hand'] },
  avoid: ['text on screen', 'extra people'],
}

const baseQa = {
  quality_score: 2,
  description_match: 3,
  physics_accuracy: 3,
  character_accuracy: 2,
  issues_found: [] as string[],
  needs_repaint: true,
  repaint_regions: [] as unknown[],
  accept: false,
}

export const EVAL_CASES = {
  qa: [
    {
      id: 'qa-finger',
      raw: {
        ...baseQa,
        issues_found: ['extra finger'],
        defects: [{
          category: 'hand_artifact',
          evidence: 'left hand has six fingers in Frame 05',
          frames: ['05'],
          t_start: 2,
          t_end: 2.5,
          present: true,
          confirmed: true,
          severity: 'major',
          region: { x: 0.41, y: 0.52, w: 0.12, h: 0.15 },
        }],
      },
      expectRepaint: true,
    },
    {
      id: 'qa-text',
      raw: {
        ...baseQa,
        issues_found: ['garbled sign'],
        defects: [{
          category: 'garbled_text',
          evidence: 'the sign letters collapse in Frame 02',
          frames: ['02'],
          t_start: 1,
          t_end: 1.2,
          present: true,
          confirmed: true,
          severity: 'major',
        }],
      },
      expectRepaint: true,
    },
    {
      id: 'qa-identity',
      raw: {
        ...baseQa,
        issues_found: ['face changed'],
        defects: [{
          category: 'identity_drift',
          evidence: 'the face at Frame 08 does not match Frame 01',
          frames: ['08'],
          t_start: 4,
          t_end: 4.5,
          present: true,
          confirmed: true,
          severity: 'major',
        }],
      },
      expectRepaint: true,
    },
    {
      id: 'qa-drift-unconfirmed',
      raw: {
        ...baseQa,
        issues_found: ['camera drift'],
        defects: [{
          category: 'camera_drift',
          evidence: 'the move feels faster than asked',
          present: true,
          confirmed: true,
          severity: 'minor',
        }],
      },
      expectRepaint: false,
    },
  ],
  director: [
    {
      id: 'director-lighthouse',
      output: {
        scene_id: 'S03',
        intent: 'The keeper sees the lamp is still lit.',
        coverage_notes: 'Establish, then the climb.',
        shots: [{ ...KEEPER_SHOT, duration_s: 6, camera: undefined, lighting: undefined, grade: undefined }],
      },
    },
    {
      id: 'director-kitchen',
      output: {
        scene_id: 'S04',
        intent: 'She leaves the key on the table.',
        coverage_notes: 'Master then close-up.',
        shots: [{
          ...KEEPER_SHOT,
          shot_id: 'S04-01',
          duration_s: 5,
          subject: 'woman at a table',
          action: 'leaves the key where it was placed',
          setting: 'kitchen, morning',
          camera: undefined,
          lighting: undefined,
          grade: undefined,
          audio: { dialogue: [], sfx: ['key on wood'], ambience: 'room', music: false },
          references: [],
          avoid: [],
        }],
      },
    },
    {
      id: 'director-street',
      output: {
        scene_id: 'S05',
        intent: 'The run and the phone call are two shots.',
        coverage_notes: 'Split the two actions.',
        shots: [
          { ...KEEPER_SHOT, shot_id: 'S05-01', action: 'sprints across the street', camera: undefined, lighting: undefined, grade: undefined },
          { ...KEEPER_SHOT, shot_id: 'S05-02', action: 'answers the phone', camera: undefined, lighting: undefined, grade: undefined },
        ],
      },
    },
    {
      id: 'director-window',
      output: {
        scene_id: 'S09',
        intent: 'The child waits.',
        coverage_notes: 'One idea: watching rain.',
        shots: [{
          ...KEEPER_SHOT,
          shot_id: 'S09-01',
          subject: 'child',
          action: 'watches rain on the glass',
          setting: 'bedroom window',
          camera: undefined,
          lighting: undefined,
          grade: undefined,
          audio: { dialogue: [], sfx: ['rain'], ambience: 'room', music: false },
          references: [],
        }],
      },
    },
  ],
  compiler: [
    { id: 'compile-veo', model: 'veo-3.1@fal' },
    { id: 'compile-kling', model: 'kling-3.0@fal' },
    { id: 'compile-seedance', model: 'seedance-2.0@fal' },
    { id: 'compile-luma', model: 'luma-ray3.14@fal' },
  ],
} as const
