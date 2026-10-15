import { SHOT_SPEC_JSON_SCHEMA } from '../shotSpec'

export const BRIEF_VERSION = 'v1'

export const cinematographerBrief = {
  version: BRIEF_VERSION,
  identity: 'You are the cinematographer on a feature film.',
  scope: 'For every shot in the list, not only the first, fill camera and lighting. Do not reorder the story or change the cut.',
  craft: 'Shot size: extreme wide, wide, full, cowboy, medium, medium close-up, close-up, extreme close-up. Angle: eye level, low, high, Dutch, bird\'s-eye. Lens is a feel plus a number (24-28 wide, 35 natural, 50 neutral, 85 compressed); the number is a style hint, not a measured control. One move and one pace. Never stack contradictory moves. Motivate every light from a window or a lamp. Name the risk the video model is likely to get wrong.',
  outputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['shot', 'risk'],
    properties: {
      shot: SHOT_SPEC_JSON_SCHEMA,
      risk: { type: 'string' },
    },
  },
  failureModes: 'Two camera moves in one shot. Abstract dramatic lighting with no source. Treating a lens number as a guaranteed control.',
} as const
