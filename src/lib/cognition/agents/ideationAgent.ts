// Creative Ideator — Tree of Thoughts: branch several creative directions, score,
// and pick the most captivating yet feasible.

import { callAgentLLM, parseAgentJSON, type CognitiveAgent } from './base'
import type { Intent } from './intentAgent'
import type { EmotionalArc } from './affectAgent'

export interface CreativeDirection {
  concept: string
  visualStyle: string
  scenes: string[]
  novelty: number
  feasibility: number
  score: number
}

export interface IdeationInput {
  intent: Intent
  arc: EmotionalArc
  pastWins: string[]
}

const SYSTEM = `You are a visionary creative director. Generate MULTIPLE distinct creative
directions for a film, then critically evaluate each for how captivating AND achievable it is,
and select the strongest. Avoid the obvious. Surprise within the bounds of the intent.
Return ONLY JSON.`

function fallback(input: IdeationInput): CreativeDirection {
  return {
    concept: input.intent.inferredGoal,
    visualStyle: 'cinematic',
    scenes: [],
    novelty: 0.5,
    feasibility: 0.8,
    score: 0.65,
  }
}

export const ideationAgent: CognitiveAgent<IdeationInput, CreativeDirection> = {
  name: 'ideation',
  fallback,
  async execute(input) {
    const { intent, arc, pastWins } = input
    const text = await callAgentLLM({
      system: SYSTEM,
      maxTokens: 1600,
      user: `Intent: ${intent.inferredGoal}
Target emotion: ${intent.targetEmotion}
Emotional arc: ${arc.shape} — ${arc.rhythmNote}
${pastWins.length ? `What worked before for this user:\n${pastWins.map(w => `- ${w}`).join('\n')}` : ''}

Generate 3 distinct creative directions (Tree of Thoughts). Score each on novelty (fresh,
captivating) and feasibility (achievable with current AI video models). Then return the SINGLE
best as JSON:
{
  "concept": "the winning core idea",
  "visualStyle": "the look and feel",
  "scenes": ["scene concept 1", "scene concept 2", "..."],
  "novelty": 0.0-1.0,
  "feasibility": 0.0-1.0,
  "score": 0.0-1.0
}`,
    })
    return parseAgentJSON<CreativeDirection>(text, fallback(input))
  },
}
