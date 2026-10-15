import { existsSync, readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

import { ROLE_BRIEFS, type ExpertRole } from './validate'

export const CONTRACT_INSTRUCTION = 'Return only JSON with exactly these keys; no extra keys.'

/**
 * The 2026-10-16 smoke sent max_tokens 400 and was billed 1158 completion
 * tokens at Grok's default effort (high), finish reason stop. Reasoning is
 * mandatory on that model and was not inside the cap. OpenRouter's effort
 * table assigns low about 20% of the budget and high about 80%. That guess was
 * 190. The low-effort re-smoke still billed 977 completion tokens, 577 above
 * the 400 cap. The allowance is that observed overrun.
 */
export const GROK_REASONING_ALLOWANCE = 577

interface JsonSchema {
  type?: string
  required?: string[]
  properties?: Record<string, JsonSchema>
  items?: JsonSchema
  minimum?: number
  maximum?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  enum?: unknown[]
}

function examplesDir(): string {
  const here = dirname(__filename)
  const candidates = [
    resolve(here, 'examples'),
    resolve(here, '../../src/experts/examples'),
  ]
  return candidates.find((dir) => existsSync(resolve(dir, 'director.json'))) ?? candidates[0]
}

export function roleExample(role: ExpertRole): unknown {
  const raw = readFileSync(resolve(examplesDir(), `${role}.json`), 'utf8')
  const rows = JSON.parse(raw) as Array<{ output: unknown }>
  return rows[0]?.output
}

export function requiredTopLevelKeys(role: ExpertRole): string[] {
  const schema = ROLE_BRIEFS[role].outputSchema as unknown as JsonSchema
  return schema.required ?? []
}

function rangeOf(schema: JsonSchema): string {
  const bits: string[] = []
  if (schema.minimum !== undefined) bits.push(`minimum ${schema.minimum}`)
  if (schema.maximum !== undefined) bits.push(`maximum ${schema.maximum}`)
  if (schema.minLength !== undefined) bits.push(`minLength ${schema.minLength}`)
  if (schema.maxLength !== undefined) bits.push(`maxLength ${schema.maxLength}`)
  if (schema.minItems !== undefined) bits.push(`minItems ${schema.minItems}`)
  if (schema.maxItems !== undefined) bits.push(`maxItems ${schema.maxItems}`)
  if (schema.enum) bits.push(`enum ${schema.enum.map((item) => JSON.stringify(item)).join(', ')}`)
  return bits.length ? ` (${bits.join(', ')})` : ''
}

function describeFields(schema: JsonSchema, indent: number): string[] {
  const pad = '  '.repeat(indent)
  const required = new Set(schema.required ?? [])
  const lines: string[] = []
  for (const [name, child] of Object.entries(schema.properties ?? {})) {
    const need = required.has(name) ? 'required' : 'optional'
    lines.push(`${pad}- ${name}: ${child.type ?? 'value'}, ${need}${rangeOf(child)}`)
    if (child.properties) lines.push(...describeFields(child, indent + 1))
    if (child.items?.properties) lines.push(...describeFields(child.items, indent + 1))
  }
  return lines
}

export function renderRoleContract(role: ExpertRole): string {
  const schema = ROLE_BRIEFS[role].outputSchema as unknown as JsonSchema
  return [
    CONTRACT_INSTRUCTION,
    'JSON schema:',
    JSON.stringify(schema, null, 2),
    'Fields:',
    ...describeFields(schema, 0),
    'Example:',
    JSON.stringify(roleExample(role), null, 2),
  ].join('\n')
}

export function expertRepairMessage(issues: string[]): string {
  return `These fields are missing or wrong: ${issues.join('; ')}; return corrected JSON only`
}
