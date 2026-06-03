// Reflective Critic — Reflexion loop: critique the creative plan BEFORE spending
// compute, then return an improved version.

import { callAgentLLM, parseAgentJSON, type CognitiveAgent } from './base'
import type { CreativeDirection } from './ideationAgent'
import type { EmotionalArc } from './affectAgent'

export interface CritiqueInput {
  direction: CreativeDirection
  arc: EmotionalArc
  intent: string
}

const SYSTEM = `You are a ruthless but constructive script editor. Critique a creative plan for
weaknesses — clichés, emotional flatness, pacing problems, scenes that won't land — then return
an IMPROVED version. Be honest about flaws; the goal is the strongest possible film. Return ONLY JSON.`

export const critiqueAgent: CognitiveAgent<CritiqueInput, CreativeDirection> = {
  name: 'critique',
  fallback: input => input.direction,
  async execute({ direction, arc, intent }) {
    const text = await callAgentLLM({
      system: SYSTEM,
      maxTokens: 1400,
      user: `Intent: ${intent}
Emotional arc: ${arc.shape}
Plan: ${JSON.stringify(direction)}

Critique it (note specific weaknesses), then return the improved plan as the same JSON shape:
{ "concept", "visualStyle", "scenes": [...], "novelty", "feasibility", "score" }
Keep what works; fix what's weak. Raise the emotional impact.`,
    })
    return parseAgentJSON<CreativeDirection>(text, direction)
  },
}
