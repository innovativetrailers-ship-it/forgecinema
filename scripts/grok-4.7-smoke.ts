import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const core = require('@cinema/core') as {
  GROK_REASONING_ALLOWANCE: number
  buildGrokRequest: (role: 'director', input: { text: string }) => {
    messages: Array<{ role: 'system' | 'user'; content: string }>
    reasoning_effort: 'low'
    response_format: { type: 'json_schema'; json_schema: { name: string; strict?: boolean; schema: unknown } }
  }
  expertRepairMessage: (issues: string[]) => string
  postFalRouterChat: (input: {
    model: string
    messages: Array<{ role: 'system' | 'user'; content: string }>
    maxTokens: number
    reasoningEffort: 'low'
    responseFormat: { type: 'json_schema'; json_schema: { name: string; strict?: boolean; schema: unknown } }
    source: string
  }) => Promise<{ content: string; inputTokens: number; outputTokens: number; reasoningTokens: number | null; finishReason: string | null; model: string }>
  validateRoleOutput: (role: 'director', raw: unknown) => { ok: boolean; issues?: string[] }
}

const AUD_PER_USD = 1.4331
const PROMPT_USD = 0.000002
const COMPLETION_USD = 0.000006
const MODEL = 'x-ai/grok-4.7'
const MAX_TOKENS = 400
const docPath = 'docs/grok-4.7-smoke-2026-10-16.md'

function money(usd: number): string {
  return `USD ${usd.toFixed(6)} / AUD ${(usd * AUD_PER_USD).toFixed(6)}`
}

if (!process.argv.includes('--yes')) {
  const allowance = 190
  console.log(`One language call. Visible cap ${MAX_TOKENS}. Reasoning allowance ${allowance}. Pass --yes to run.`)
  process.exit(0)
}

if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) throw new Error('FAL_KEY missing')
process.env.GENERATION_PAUSED = 'false'

function parseContent(content: string): { parsed: unknown; issues: string[] } {
  try {
    const start = content.indexOf('{')
    const end = content.lastIndexOf('}')
    const parsed = JSON.parse(start >= 0 && end > start ? content.slice(start, end + 1) : content) as unknown
    return { parsed, issues: [] }
  } catch (err) {
    return { parsed: null, issues: [err instanceof Error ? err.message : String(err)] }
  }
}

async function call(label: string, messages: Array<{ role: 'system' | 'user'; content: string }>, format: {
  type: 'json_schema'
  json_schema: { name: string; strict?: boolean; schema: unknown }
}): Promise<{ text: string; spent: string; detail: string; ok: boolean; issues: string[]; refusal: boolean }> {
  const guess = Math.ceil(messages.map((message) => message.content.length).reduce((sum, n) => sum + n, 0) / 4)
  const allowance = core.GROK_REASONING_ALLOWANCE
  const estimate = guess * PROMPT_USD + (MAX_TOKENS + allowance) * COMPLETION_USD
  console.log(`${label} before ${money(estimate)} (guess ${guess} prompt tokens, cap ${MAX_TOKENS} plus reasoning allowance ${allowance})`)
  const result = await core.postFalRouterChat({
    model: MODEL,
    messages,
    maxTokens: MAX_TOKENS,
    reasoningEffort: 'low',
    responseFormat: format,
    source: 'grok-4.7-smoke',
  })
  const spentUsd = result.inputTokens * PROMPT_USD + result.outputTokens * COMPLETION_USD
  const spent = money(spentUsd)
  console.log(`${label} after ${spent} tokens in ${result.inputTokens} out ${result.outputTokens} reasoning ${result.reasoningTokens ?? 'unreported'} finish ${result.finishReason}`)
  const refusal = result.finishReason === 'refusal' || /refusal/i.test(result.finishReason ?? '')
  const extracted = parseContent(result.content)
  const validated = extracted.parsed ? core.validateRoleOutput('director', extracted.parsed) : { ok: false, issues: extracted.issues }
  const issues = validated.ok ? [] : (validated.issues ?? extracted.issues)
  return {
    text: result.content,
    spent,
    detail: `After: ${spent}. Prompt tokens ${result.inputTokens}, completion tokens ${result.outputTokens}, reasoning tokens ${result.reasoningTokens ?? 'unreported'}. Finish ${result.finishReason ?? 'none'}.`,
    ok: validated.ok && !refusal,
    issues,
    refusal,
  }
}

const beat = 'A lighthouse keeper climbs a dark stair in a storm, stops, and sees the lamp still burning. One shot.'
const request = core.buildGrokRequest('director', { text: beat })
const first = await call('schema', request.messages, request.response_format)
let repairNote = 'Repair was not needed.'
let calls = 1
if (!first.ok && !first.refusal && calls < 2) {
  const repair = await call('repair', [
    ...request.messages,
    { role: 'user', content: core.expertRepairMessage(first.issues) },
  ], request.response_format)
  calls += 1
  repairNote = repair.ok
    ? `Repair passed. ${repair.detail}`
    : `Repair failed. ${repair.detail} ${repair.issues.join('; ')}`
  if (repair.ok) first.ok = true
  first.text = `${first.text}\n\n${repair.text}`
}

let darker = 'Darker beat was not sent. The second call was kept for a repair, or the first call failed.'
if (first.ok && calls < 2) {
  const darkBeat = 'Two rivals meet in a rain alley and fight with fists. No gore. No real people. One shot.'
  const darkRequest = core.buildGrokRequest('director', { text: darkBeat })
  const second = await call('darker', darkRequest.messages, darkRequest.response_format)
  calls += 1
  darker = second.refusal
    ? `Refusal: ${second.text.slice(0, 800)}`
    : `Accepted. Schema ${second.ok ? 'valid' : `invalid (${second.issues.join('; ')})`}. ${second.detail}`
}

const prior = readFileSync(docPath, 'utf8').replace(/\n## Run 54[\s\S]*$/, '\n')
const section = [
  '## Run 54',
  '',
  'max_tokens was forwarded. The field name on this route is max_tokens, which OpenRouter lists for x-ai/grok-4.7. The first smoke billed 1158 completion tokens against a cap of 400 with finish reason stop, so reasoning was outside the cap. Reasoning is mandatory and the default effort is high. This run sends reasoning_effort low. The before-cost uses cap 400 plus a 190-token allowance.',
  '',
  `- Schema call: ${first.detail}`,
  `- Schema result: ${first.ok ? 'valid' : `invalid (${first.issues.join('; ')})`}. Refusal: ${first.refusal ? 'yes' : 'no'}.`,
  `- ${repairNote}`,
  `- ${darker}`,
  `- Live calls this run: ${calls}.`,
  '',
  first.text.slice(0, 1200),
  '',
].join('\n')
writeFileSync(docPath, `${prior.trim()}\n\n${section}`)
if (!first.ok) {
  console.error('smoke failed', first.issues.join('; '))
  process.exit(1)
}
console.log('smoke passed')
