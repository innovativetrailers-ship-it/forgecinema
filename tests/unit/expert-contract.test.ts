import { readFileSync } from 'node:fs'
import {
  EXPERT_ROLES,
  GROK_REASONING_ALLOWANCE,
  buildClaudeRequest,
  buildGeminiRequest,
  buildGptRequest,
  buildGrokRequest,
  expertRepairMessage,
  acceptRoleOutput,
  postFalRouterChat,
  validateRoleOutput,
  type ExpertRole,
} from '@cinema/core'

const root = '/Users/imac/cinema/cinema-integrated'

function exampleOf(role: ExpertRole): unknown {
  const rows = JSON.parse(readFileSync(`${root}/packages/core/src/experts/examples/${role}.json`, 'utf8')) as Array<{ output: unknown }>
  return rows[0].output
}

function exampleMarker(value: unknown): string {
  if (typeof value === 'string' && value.length > 12) return value
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = exampleMarker(item)
      if (found) return found
    }
  }
  if (value && typeof value === 'object') {
    for (const item of Object.values(value as Record<string, unknown>)) {
      const found = exampleMarker(item)
      if (found) return found
    }
  }
  return ''
}

function requiredOf(role: ExpertRole): string[] {
  const briefs = {
    director: ['scene_id', 'intent', 'shots', 'coverage_notes'],
    cinematographer: ['shot', 'risk'],
    colourist: ['scene_id', 'grade', 'shot_adjustments'],
    editor: ['timeline', 'total_s', 'pace_curve', 'flagged_cuts'],
    sound: ['shot_id', 'audio', 'native_audio', 'sound_plan'],
    continuity: ['shot_id', 'violations', 'pass'],
    qa: ['quality_score', 'description_match', 'physics_accuracy', 'character_accuracy', 'defects', 'issues_found', 'needs_repaint', 'repaint_regions', 'accept'],
  }
  return briefs[role]
}

function textOf(value: unknown): string {
  return JSON.stringify(value)
}

describe('adapter contracts', () => {
  test.each(EXPERT_ROLES)('grok %s request names the required keys and the example', (role) => {
    const request = buildGrokRequest(role, { text: 'Beat.' })
    const text = textOf(request)
    for (const key of requiredOf(role)) expect(text).toContain(key)
    expect(text).toContain('Return only JSON with exactly these keys; no extra keys.')
    expect(text).toContain(exampleMarker(exampleOf(role)))
    expect(request.reasoning_effort).toBe('low')
    expect(request.response_format.json_schema.strict).toBe(true)
  })

  test.each(EXPERT_ROLES)('claude %s request names the required keys and the example', (role) => {
    const text = textOf(buildClaudeRequest(role, { text: 'Beat.' }))
    for (const key of requiredOf(role)) expect(text).toContain(key)
    expect(text).toContain(exampleMarker(exampleOf(role)))
  })

  test.each(EXPERT_ROLES)('gemini %s request names the required keys and the example', (role) => {
    const text = textOf(buildGeminiRequest(role, { text: 'Beat.', videoUri: 'https://example.invalid/a.mp4' }))
    for (const key of requiredOf(role)) expect(text).toContain(key)
    expect(text).toContain(exampleMarker(exampleOf(role)))
  })

  test.each(EXPERT_ROLES)('gpt %s request names the required keys and the example', (role) => {
    const text = textOf(buildGptRequest(role, { text: 'Beat.' }))
    for (const key of requiredOf(role)) expect(text).toContain(key)
    expect(text).toContain(exampleMarker(exampleOf(role)))
  })

  test('a mocked invalid reply is repaired once with the missing fields', async () => {
    const example = exampleOf('director')
    let sent = ''
    const value = await acceptRoleOutput('director', { coverage_plan: 'no' }, async (issues) => {
      sent = expertRepairMessage(issues)
      return example
    })
    expect(sent.startsWith('These fields are missing or wrong: ')).toBe(true)
    expect(sent).toContain('scene_id')
    expect(sent.endsWith('; return corrected JSON only')).toBe(true)
    expect(validateRoleOutput('director', value).ok).toBe(true)
    expect(GROK_REASONING_ALLOWANCE).toBe(577)
  })

  test('the router forwards max_tokens, reasoning_effort, and the schema', async () => {
    const fetchImpl = jest.fn(async () => new Response(JSON.stringify({
      choices: [{ finish_reason: 'stop', message: { content: '{"ok":true}' } }],
      usage: { prompt_tokens: 3, completion_tokens: 5, completion_tokens_details: { reasoning_tokens: 2 } },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    const grok = buildGrokRequest('director', { text: 'A dark stair.' })
    const result = await postFalRouterChat({
      model: 'x-ai/grok-4.7',
      messages: grok.messages,
      maxTokens: 400,
      reasoningEffort: grok.reasoning_effort,
      responseFormat: grok.response_format,
      source: 'expert-contract-test',
      falKey: 'test-key',
      ignorePause: true,
    }, fetchImpl as unknown as typeof fetch)
    const call = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    const body = JSON.parse(String(call[1].body)) as {
      max_tokens: number
      reasoning_effort: string
      response_format: { type: string }
    }
    expect(body.max_tokens).toBe(400)
    expect(body.reasoning_effort).toBe('low')
    expect(body.response_format.type).toBe('json_schema')
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(result.reasoningTokens).toBe(2)
  })
})
