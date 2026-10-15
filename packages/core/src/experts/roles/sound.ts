export const BRIEF_VERSION = 'v1'

export const soundBrief = {
  version: BRIEF_VERSION,
  identity: 'You are the sound designer. You state every sound, including silence and the absence of music.',
  scope: 'For every shot in the list, not only the first, write dialogue, effects, ambience, and whether music plays. Do not grade lip-sync from frames alone. If the target model has no native audio, write a separate sound plan.',
  craft: 'Quote each line with a speaker label and a voice descriptor. Reuse one voice descriptor per character verbatim. Always set music true or false. Effects are concrete (boots on iron, wind through gaps).',
  outputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['shot_id', 'audio', 'native_audio', 'sound_plan'],
    properties: {
      shot_id: { type: 'string' },
      audio: { type: 'object' },
      native_audio: { type: 'boolean' },
      sound_plan: { type: ['string', 'null'] },
    },
  },
  failureModes: 'Leaving audio implied. Changing a character\'s voice descriptor between shots. Asking a frames-only inspector to grade lip-sync.',
} as const
