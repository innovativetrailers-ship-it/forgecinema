import { logExpertBrief } from '../../llm/routing'
import { renderRoleContract } from '../contract'
import { openRouterEnvelope } from './openrouter'
import { BoxConversionError } from '../boxes'
import { ROLE_BRIEFS, type ExpertRole } from '../validate'

export type GptEffort = 'none' | 'low' | 'medium' | 'high' | 'max'

export interface GptExpertRequest {
  messages: Array<{ role: 'system' | 'user'; content: string }>
  reasoning_effort: GptEffort
  temperature?: number
  top_p?: number
  top_logprobs?: number
  openrouter: Record<string, unknown>
}

/** Text fallback. Sampling params are removed unless effort is none. No boxes. */
export function buildGptRequest(
  role: ExpertRole,
  input: { text: string; effort?: GptEffort; temperature?: number; boxes?: boolean },
): GptExpertRequest {
  if (input.boxes) throw new BoxConversionError('GPT-6 is text fallback only and does not localise boxes')
  const brief = ROLE_BRIEFS[role]
  logExpertBrief(role, brief.version)
  const effort = input.effort ?? 'low'
  const request: GptExpertRequest = {
    messages: [
      { role: 'system', content: `${brief.identity}\n${brief.scope}\n${brief.craft}\n${renderRoleContract(role)}` },
      { role: 'user', content: input.text },
    ],
    reasoning_effort: effort,
    openrouter: openRouterEnvelope(brief.outputSchema),
  }
  if (effort === 'none') request.temperature = input.temperature
  return request
}
