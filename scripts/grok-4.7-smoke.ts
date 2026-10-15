import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const core = require('@cinema/core') as {
  buildGrokRequest: (role: 'director', input: { text: string }) => { messages: Array<{ role: 'system' | 'user'; content: string }> }
  postFalRouterChat: (input: {
    model: string
    messages: Array<{ role: 'system' | 'user'; content: string }>
    maxTokens: number
    responseFormat: 'json_object'
    source: string
  }) => Promise<{ content: string; inputTokens: number; outputTokens: number; finishReason: string | null; model: string }>
  validateRoleOutput: (role: 'director', raw: unknown) => { ok: boolean; issues?: string[] }
}

const AUD_PER_USD = 1.4331
const PROMPT_USD = 0.000002
const COMPLETION_USD = 0.000006
const MODEL = 'x-ai/grok-4.7'

function money(usd: number): string {
  return `USD ${usd.toFixed(6)} / AUD ${(usd * AUD_PER_USD).toFixed(6)}`
}

if (!process.argv.includes('--yes')) {
  console.log('One language call, max 400 tokens. Pass --yes to run.')
  process.exit(0)
}

if (!process.env.FAL_KEY && !process.env.FAL_API_KEY) throw new Error('FAL_KEY missing')
process.env.GENERATION_PAUSED = 'false'

const beat = 'A lighthouse keeper climbs a dark stair in a storm, stops, and sees the lamp still burning. One shot. Return only the director JSON.'
const request = core.buildGrokRequest('director', { text: beat })
const promptTokensGuess = Math.ceil(request.messages.map((message) => message.content.length).reduce((sum, n) => sum + n, 0) / 4)
const estimate = promptTokensGuess * PROMPT_USD + 400 * COMPLETION_USD
console.log(`before ${money(estimate)} (guess ${promptTokensGuess} prompt tokens, cap 400 completion)`)

const result = await core.postFalRouterChat({
  model: MODEL,
  messages: request.messages,
  maxTokens: 400,
  responseFormat: 'json_object',
  source: 'grok-4.7-smoke',
})
const spent = result.inputTokens * PROMPT_USD + result.outputTokens * COMPLETION_USD
console.log(`after ${money(spent)} tokens in ${result.inputTokens} out ${result.outputTokens} finish ${result.finishReason}`)

const refusal = result.finishReason === 'refusal' || /refusal/i.test(result.finishReason ?? '')
let parsed: unknown = null
let issues: string[] = []
try {
  const start = result.content.indexOf('{')
  const end = result.content.lastIndexOf('}')
  parsed = JSON.parse(start >= 0 && end > start ? result.content.slice(start, end + 1) : result.content)
} catch (err) {
  issues = [err instanceof Error ? err.message : String(err)]
}
const validated = parsed ? core.validateRoleOutput('director', parsed) : { ok: false, issues }
if (!validated.ok) issues = validated.issues ?? issues

const doc = [
  '# Grok 4.7 smoke 2026-10-16',
  '',
  'One call through the language router. Max tokens 400.',
  '',
  `- Model: \`${MODEL}\`. Alias on the list: \`x-ai/grok-4.7-20260916\`. \`x-ai/grok-4\` is not on the list and is not an alias of 4.7.`,
  `- List price: prompt USD 2 / million, completion USD 6 / million. AUD uses 1 USD = 1.4331 AUD from the pricing table (Frankfurter 2026-10-13).`,
  `- Before: ${money(estimate)}.`,
  `- After: ${money(spent)}. Prompt tokens ${result.inputTokens}, completion tokens ${result.outputTokens}.`,
  `- Finish reason: ${result.finishReason ?? 'none'}.`,
  `- Refusal: ${refusal ? 'yes' : 'no'}.`,
  `- Director schema: ${validated.ok ? 'valid' : `invalid (${issues.join('; ')})`}.`,
  '',
  '## Transcript summary',
  '',
  result.content.slice(0, 1200),
  '',
].join('\n')
writeFileSync('docs/grok-4.7-smoke-2026-10-16.md', doc)
if (!validated.ok || refusal) {
  console.error('smoke failed', issues.join('; '))
  process.exit(1)
}
console.log('smoke passed')
