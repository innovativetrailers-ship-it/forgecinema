import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const core = require('@cinema/core') as {
  liveEvalPlan: (argv: readonly string[]) => { run: boolean; cost: string }
  EVAL_CASES: { qa: Array<{ raw: unknown; expectRepaint: boolean }> }
  buildClaudeRequest: (role: 'qa', input: { text: string }) => { system: string }
  buildGeminiRequest: (role: 'qa', input: { text: string; videoUri: string; fps: number }) => {
    contents: Array<{ parts: Array<{ text?: string }> }>
  }
  postFalRouterChat: (input: {
    model: string
    messages: Array<{ role: 'system' | 'user'; content: string }>
    responseFormat: 'json_object'
    source: string
  }) => Promise<{ content: string }>
  validateQaOutput: (raw: unknown) => { ok: boolean; value?: { needs_repaint: boolean } }
}

const plan = core.liveEvalPlan(process.argv.slice(2))
console.log(plan.cost)
if (!plan.run) {
  console.log('Pass --yes to run. This script is not part of CI.')
  process.exit(0)
}

let agreed = 0
for (const item of core.EVAL_CASES.qa) {
  const claude = core.buildClaudeRequest('qa', { text: JSON.stringify(item.raw) })
  const gemini = core.buildGeminiRequest('qa', { text: JSON.stringify(item.raw), videoUri: 'https://example.invalid/clip.mp4', fps: 4 })
  const jobs = [
    { model: 'anthropic/claude-sonnet-5', system: claude.system },
    {
      model: 'google/gemini-3.5-flash-lite',
      system: gemini.contents[0].parts.map((part) => part.text ?? '').join('\n'),
    },
  ]
  for (const job of jobs) {
    const result = await core.postFalRouterChat({
      model: job.model,
      messages: [
        { role: 'system', content: job.system },
        { role: 'user', content: 'Return the QA JSON for the known defect. Do not invent fields.' },
      ],
      responseFormat: 'json_object',
      source: 'eval-live',
    })
    let parsed: unknown
    try {
      parsed = JSON.parse(result.content)
    } catch (err) {
      console.warn('[eval-live]', err instanceof Error ? err.message : err)
      continue
    }
    const qa = core.validateQaOutput(parsed)
    if (qa.ok && qa.value && qa.value.needs_repaint === item.expectRepaint) agreed += 1
  }
}
console.log(`agreed ${agreed} of ${core.EVAL_CASES.qa.length * 2}`)
