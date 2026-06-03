// Intent Modeler — understand what the user REALLY wants, beyond the literal prompt.

import { callAgentLLM, parseAgentJSON, type CognitiveAgent } from './base'
import { recallSemantic } from '../memory/semantic'

export interface Intent {
  literalRequest: string
  inferredGoal: string
  targetEmotion: string
  audience: string
  references: string[]
  unstatedNeeds: string[]
  energyLevel: 'calm' | 'building' | 'high' | 'explosive'
  confidence: number
}

export interface IntentInput {
  userId: string
  prompt: string
}

const SYSTEM = `You are a perceptive creative director. Read beneath the surface of a video
request to understand true intent — the goal, the feeling, the unspoken needs. Consider the
user's known preferences. Return ONLY valid JSON.`

function fallback(input: IntentInput): Intent {
  return {
    literalRequest: input.prompt,
    inferredGoal: input.prompt,
    targetEmotion: 'neutral',
    audience: 'general',
    references: [],
    unstatedNeeds: [],
    energyLevel: 'building',
    confidence: 0.3,
  }
}

export const intentAgent: CognitiveAgent<IntentInput, Intent> = {
  name: 'intent',
  fallback,
  async execute(input) {
    const taste = await recallSemantic(input.userId, input.prompt, 5).catch(() => [])
    const tasteContext = taste.length
      ? `Known preferences for this user:\n${taste.map(t => `- ${t.insight}`).join('\n')}`
      : 'No prior preferences known yet.'

    const text = await callAgentLLM({
      system: SYSTEM,
      maxTokens: 800,
      user: `Request: "${input.prompt}"

${tasteContext}

Infer the deeper intent. Return JSON:
{
  "literalRequest": "what they literally asked for",
  "inferredGoal": "what they're really trying to achieve",
  "targetEmotion": "the dominant feeling the film should evoke",
  "audience": "who this is likely for",
  "references": ["implied stylistic or tonal references"],
  "unstatedNeeds": ["things they didn't say but likely want"],
  "energyLevel": "calm|building|high|explosive",
  "confidence": 0.0-1.0
}`,
    })
    return parseAgentJSON<Intent>(text, fallback(input))
  },
}
