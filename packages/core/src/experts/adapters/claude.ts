import { logExpertBrief } from '../../llm/routing'
import { openRouterEnvelope } from './openrouter'
import { ROLE_BRIEFS, type ExpertRole } from '../validate'

export interface ClaudeImage {
  mediaType: string
  data: string
  label: string
}

export interface ClaudeExpertRequest {
  system: string
  messages: Array<{
    role: 'user'
    content: Array<
      | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } }
      | { type: 'text'; text: string }
    >
  }>
  output_config: { format: { type: 'json_schema'; schema: unknown } }
  max_tokens: number
  openrouter: Record<string, unknown>
}

const NO_SAMPLING = ['temperature', 'top_p', 'top_k'] as const

/** System role, XML sections, images before text. No prefill. No sampling params. */
export function buildClaudeRequest(
  role: ExpertRole,
  input: { text: string; images?: ClaudeImage[]; maxTokens?: number },
): ClaudeExpertRequest {
  const brief = ROLE_BRIEFS[role]
  logExpertBrief(role, brief.version)
  const images = input.images ?? []
  const content: ClaudeExpertRequest['messages'][0]['content'] = []
  for (const image of images) {
    content.push({
      type: 'image',
      source: { type: 'base64', media_type: image.mediaType, data: image.data },
    })
  }
  const labels = images.map((image) => image.label).join('\n')
  content.push({
    type: 'text',
    text: [labels, input.text].filter(Boolean).join('\n\n'),
  })
  const system = [
    brief.identity,
    `<scope>${brief.scope}</scope>`,
    `<craft>${brief.craft}</craft>`,
    `<failures>${brief.failureModes}</failures>`,
    '<output>Return JSON for the schema. Ask for evidence. Do not add a field named reasoning.</output>',
  ].join('\n')
  const request: ClaudeExpertRequest = {
    system,
    messages: [{ role: 'user', content }],
    output_config: { format: { type: 'json_schema', schema: brief.outputSchema } },
    max_tokens: input.maxTokens ?? 2048,
    openrouter: openRouterEnvelope(brief.outputSchema),
  }
  for (const key of NO_SAMPLING) {
    if (key in request) throw new Error(`Claude request must not send ${key}`)
  }
  return request
}

export type ClaudeStop =
  | { kind: 'ok'; text: string }
  | { kind: 'refusal' }
  | { kind: 'truncated' }

/** refusal and max_tokens both arrive as HTTP 200. */
export function parseClaudeStop(body: { stop_reason?: string; content?: Array<{ text?: string }> }): ClaudeStop {
  if (body.stop_reason === 'refusal') return { kind: 'refusal' }
  if (body.stop_reason === 'max_tokens') return { kind: 'truncated' }
  const text = (body.content ?? []).map((block) => block.text ?? '').join('').trim()
  return { kind: 'ok', text }
}
