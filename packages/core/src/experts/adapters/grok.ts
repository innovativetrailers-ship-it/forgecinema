import { logExpertBrief } from '../../llm/routing'
import { renderRoleContract } from '../contract'
import { openRouterEnvelope } from './openrouter'
import { ROLE_BRIEFS, type ExpertRole } from '../validate'

export interface GrokLimits {
  genre: string
  pointOfView: string
  intensityCeiling: string
  contentLimits: string
}

export interface GrokExpertRequest {
  source_tier: 'T2'
  messages: Array<{ role: 'system' | 'user'; content: string }>
  reasoning_effort: 'low'
  response_format: { type: 'json_schema'; json_schema: { name: string; strict?: boolean; schema: unknown } }
  openrouter: Record<string, unknown>
}

const DEFAULT_LIMITS: GrokLimits = {
  genre: 'dramatic fiction',
  pointOfView: 'third person',
  intensityCeiling: 'mature drama, no sexual content involving minors, no real-person sexual or defamatory depiction',
  contentLimits: 'Stay inside the stated genre. Do not raise intensity past the ceiling.',
}

/** Genre, point of view, intensity, and limits. No blanket shock line. Flagged T2 until verified. */
export function buildGrokRequest(
  role: ExpertRole,
  input: { text: string; limits?: Partial<GrokLimits> },
): GrokExpertRequest {
  const brief = ROLE_BRIEFS[role]
  logExpertBrief(role, brief.version)
  const limits = { ...DEFAULT_LIMITS, ...input.limits }
  const system = [
    brief.identity,
    `Genre: ${limits.genre}`,
    `Point of view: ${limits.pointOfView}`,
    `Intensity ceiling: ${limits.intensityCeiling}`,
    `Content limits: ${limits.contentLimits}`,
    brief.scope,
    brief.craft,
    renderRoleContract(role),
  ].join('\n')
  if (/edgy|not afraid to offend/i.test(system)) {
    throw new Error('Grok brief must not use a blanket shock line')
  }
  const schema = brief.outputSchema
  return {
    source_tier: 'T2',
    reasoning_effort: 'low',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: input.text },
    ],
    response_format: { type: 'json_schema', json_schema: { name: 'expert_output', strict: true, schema } },
    openrouter: openRouterEnvelope(schema),
  }
}
