import { readFileSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import {
  EXPERT_ROLES,
  ROLE_BRIEFS,
  KEEPER_SHOT,
  EVAL_CASES,
  acceptRoleOutput,
  validateRoleOutput,
  validateQaOutput,
  compileShot,
  ModelCompileError,
  geminiBoxToForge,
  claudePixelsToForge,
  BoxConversionError,
  buildClaudeRequest,
  parseClaudeStop,
  buildGeminiRequest,
  formatGeminiTimestamp,
  buildGptRequest,
  buildGrokRequest,
  getModelKnowledge,
  liveEvalPlan,
  composeRolePrompt,
} from '@cinema/core'
import { CASTING_DIRECTOR_PROMPT, QA_INSPECTOR_PROMPT } from '@/lib/swarm/brain-prompts'
import { ART_DIRECTOR_SYSTEM_PROMPT } from '@/lib/brain/prompts'

const root = '/Users/imac/cinema/cinema-integrated'

describe('expert briefs', () => {
  test('each role example matches its schema', () => {
    for (const role of EXPERT_ROLES) {
      expect(ROLE_BRIEFS[role].version).toBe('v1')
      const examples = JSON.parse(readFileSync(`${root}/packages/core/src/experts/examples/${role}.json`, 'utf8')) as Array<{ name: string; output: unknown }>
      expect(examples).toHaveLength(3)
      for (const example of examples) {
        const parsed = validateRoleOutput(role, example.output)
        expect(parsed.ok).toBe(true)
      }
    }
  })

  test('prompts are the briefs and one quality card of text names the version', () => {
    expect(CASTING_DIRECTOR_PROMPT.startsWith('[expert director v1]')).toBe(true)
    expect(QA_INSPECTOR_PROMPT.startsWith('[expert qa v1]')).toBe(true)
    expect(ART_DIRECTOR_SYSTEM_PROMPT).toContain('[expert cinematographer v1]')
    expect(composeRolePrompt('colourist')).toContain(ROLE_BRIEFS.colourist.craft.slice(0, 24))
  })

  test('qa drops repaint when the defect has no frame or time', () => {
    const raw = EVAL_CASES.qa[3].raw
    const parsed = validateQaOutput(raw, 8)
    expect(parsed.ok).toBe(true)
    expect(parsed.value?.needs_repaint).toBe(false)
    expect(parsed.value?.defects[0].confirmed).toBe(false)
  })

  test('qa keeps a confirmed defect and clamps an out-of-range score', () => {
    const raw = { ...EVAL_CASES.qa[0].raw, quality_score: 9 }
    const parsed = validateQaOutput(raw, 8)
    expect(parsed.ok).toBe(true)
    expect(parsed.value?.needs_repaint).toBe(true)
    expect(parsed.value?.quality_score).toBe(5)
  })

  test('a zero-area box fails, then one repair can succeed', async () => {
    const broken = {
      ...EVAL_CASES.qa[0].raw,
      defects: [{
        ...EVAL_CASES.qa[0].raw.defects[0],
        region: { x: 0.2, y: 0.2, w: 0, h: 0.1 },
      }],
    }
    await expect(acceptRoleOutput('qa', broken, async () => EVAL_CASES.qa[0].raw)).resolves.toMatchObject({ needs_repaint: true })
    await expect(acceptRoleOutput('qa', broken, async () => broken)).rejects.toThrow(/zero-area/)
  })

  test('gemini boxes are y-first and claude boxes are pixels of the sent image', () => {
    const box = geminiBoxToForge([100, 500, 200, 600])
    expect(box).toEqual({ x: 0.5, y: 0.1, w: 0.1, h: 0.1 })
    expect(box.x).not.toBe(0.1)
    expect(claudePixelsToForge([10, 20, 30, 60], 100, 200)).toEqual({ x: 0.1, y: 0.1, w: 0.2, h: 0.2 })
    expect(() => claudePixelsToForge([10, 10, 10, 20], 100, 100)).toThrow(BoxConversionError)
  })

  test('adapters follow the family rules', () => {
    const claude = buildClaudeRequest('qa', {
      text: 'What is wrong?',
      images: [{ mediaType: 'image/png', data: 'a', label: 'Frame 07, t=00:03.50' }],
    })
    expect(claude.messages[0].content[0].type).toBe('image')
    expect(claude.messages[0].role).toBe('user')
    expect(claude).not.toHaveProperty('temperature')
    expect(claude.openrouter.require_parameters).toBe(true)
    expect(parseClaudeStop({ stop_reason: 'refusal', content: [{ text: '' }] })).toEqual({ kind: 'refusal' })
    expect(parseClaudeStop({ stop_reason: 'max_tokens' })).toEqual({ kind: 'truncated' })

    const gemini = buildGeminiRequest('qa', { text: 'Look.', videoUri: 'https://example.invalid/a.mp4', fps: 8, atSeconds: [3.5] })
    expect(gemini.contents[0].parts[0]).toHaveProperty('fileData')
    expect(gemini.contents[0].parts[0]).toMatchObject({ videoMetadata: { fps: 8 } })
    expect(formatGeminiTimestamp(3.5)).toBe('00:03')
    expect(gemini.openrouter.require_parameters).toBe(true)

    const gpt = buildGptRequest('director', { text: 'Beat.', effort: 'low', temperature: 0.2 })
    expect(gpt).not.toHaveProperty('temperature')
    expect(buildGptRequest('director', { text: 'Beat.', effort: 'none', temperature: 0.2 }).temperature).toBe(0.2)
    expect(() => buildGptRequest('qa', { text: 'x', boxes: true })).toThrow(/text fallback/)

    const grok = buildGrokRequest('director', { text: 'A storm.' })
    expect(grok.source_tier).toBe('T2')
    expect(JSON.stringify(grok).toLowerCase()).not.toContain('edgy')
    expect(grok.openrouter.require_parameters).toBe(true)
    expect(grok.messages[0].content).toContain('Intensity ceiling')
  })

  test('the compiler clamps, refuses a retired model, and never sends luma a negative', () => {
    for (const item of EVAL_CASES.compiler) {
      const compiled = compileShot(KEEPER_SHOT, item.model)
      expect(compiled.prompt.length).toBeGreaterThan(20)
    }
    const veo = compileShot(KEEPER_SHOT, 'veo-3.1@fal')
    expect(veo.duration_s).toBe(6)
    expect(veo.params.duration).toBe('6s')
    const kling = compileShot(KEEPER_SHOT, 'kling-3.0@fal')
    expect(kling.prompt).toContain('[KEEPER: gravelly, low]: "She\'s still burning."')
    expect(kling.params.negative_prompt).toBe('text on screen, extra people')
    const long = compileShot({ ...KEEPER_SHOT, action: Array(180).fill('walks').join(' ') }, 'seedance-2.0@fal')
    expect(long.prompt.split(/\s+/).filter(Boolean).length).toBeLessThanOrEqual(100)
    const luma = compileShot(KEEPER_SHOT, 'luma-ray3.14@fal')
    expect(luma.params).not.toHaveProperty('negative_prompt')
    expect(JSON.stringify(luma).toLowerCase()).not.toContain('negative')
    expect(() => compileShot(KEEPER_SHOT, 'sora-2@fal')).toThrow(ModelCompileError)
    expect(() => compileShot(KEEPER_SHOT, 'sora-2@fal')).toThrow(/retired/)
    expect(() => compileShot(KEEPER_SHOT, 'not-a-model@fal')).toThrow(/unknown model/)
    for (const item of EVAL_CASES.director) {
      expect(validateRoleOutput('director', item.output).ok).toBe(true)
    }
    for (const item of EVAL_CASES.qa) {
      const parsed = validateQaOutput(item.raw)
      expect(parsed.ok).toBe(true)
      expect(parsed.value?.needs_repaint).toBe(item.expectRepaint)
    }
  })

  test('layer 1 seed is attached and the live duration stays on the entry', () => {
    const veo = getModelKnowledge('veo-3.1')
    expect(veo?.parameterSeed?.registryId).toBe('veo-3.1@fal')
    expect(veo?.parameterSeed?.status).toBe('live')
    expect(veo?.maxDuration).toBeGreaterThan(0)
  })

  test('web and desktop import the same package, and the live script does not spend', () => {
    const desktop = JSON.parse(readFileSync('/Users/imac/cinema/cinema/cinematic-forge-v3/package.json', 'utf8')) as { dependencies: Record<string, string> }
    const web = JSON.parse(readFileSync(`${root}/package.json`, 'utf8')) as { dependencies: Record<string, string> }
    expect(web.dependencies).toHaveProperty('@cinema/core')
    expect(desktop.dependencies).toHaveProperty('@cinema/core')
    expect(typeof compileShot).toBe('function')
    expect(liveEvalPlan(['node', 'scripts/eval-live.ts']).run).toBe(false)
    const dry = spawnSync(process.execPath, ['--experimental-strip-types', 'scripts/eval-live.ts'], { cwd: root, encoding: 'utf8' })
    expect(dry.status).toBe(0)
    expect(dry.stdout).toContain('8 language calls')
    expect(dry.stdout).toContain('--yes')
  })
})
