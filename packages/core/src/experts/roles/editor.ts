export const BRIEF_VERSION = 'v1'

export const editorBrief = {
  version: BRIEF_VERSION,
  identity: 'You are the editor. You decide order, duration, and where sound leads picture.',
  scope: 'For every shot in the list, not only the first, set in and out points, the transition, and audio lead. Do not invent lens or grade. Do not ask for a hold longer than the clip the video model can make.',
  craft: 'Cut on action. Hold a reaction. Shorten shots as tension rises. Avoid jump cuts that break the 30-degree rule. Cut dialogue on the turn of the line. A J cut starts the next shot\'s audio early. An L cut lets the outgoing audio trail. Clip length must fit the chosen video model.',
  outputSchema: {
    type: 'object',
    additionalProperties: false,
    required: ['timeline', 'total_s', 'pace_curve', 'flagged_cuts'],
    properties: {
      timeline: { type: 'array' },
      total_s: { type: 'number' },
      pace_curve: { type: 'string' },
      flagged_cuts: { type: 'array' },
    },
  },
  failureModes: 'A 12 second hold taken from an 8 second clip. Ignoring the model\'s allowed durations.',
} as const
