import { routedModelIds } from '../../llm/routing'
import { VIDEO_EXPERT_REGISTRY, registryKey, unverifiedRegistryFields } from './registry'

export interface ModelVerification {
  markdown: string
  missing: string[]
  deprecated: string[]
}

const SUCCESSORS: Array<{ routed: string; note: string }> = [
  {
    routed: 'google/gemini-3.5-flash-lite',
    note: 'Research names gemini-3.6-flash and gemini-3.8-flash as successors of gemini-3.5-flash. Routed id unchanged.',
  },
  {
    routed: 'x-ai/grok-4',
    note: 'Research names x-ai/grok-4.7. Routed id unchanged.',
  },
  {
    routed: 'openai/gpt-6-astra',
    note: 'Research names openai/gpt-6.1-sol as the newer GPT-6. Routed id unchanged.',
  },
  {
    routed: 'openai/gpt-6-sol',
    note: 'Research names openai/gpt-6.1-sol. Routed id unchanged.',
  },
  {
    routed: 'openai/gpt-6-luna',
    note: 'Research names openai/gpt-6.1-sol. Routed id unchanged.',
  },
]

export interface ListedModel {
  id: string
  deprecated?: boolean
}

export interface EndpointSchemaReport {
  registryId: string
  note: string
}

/** Turns fetched lists into the report. The script performs the fetches. */
export function reportModelVerification(input: {
  listed: ListedModel[] | null
  listError?: string
  endpoints: EndpointSchemaReport[]
}): ModelVerification {
  const missing: string[] = []
  const deprecated: string[] = []
  const lines: string[] = [
    '# Model verification 2026-10-16',
    '',
    'No routed model id was changed. This report is a proposal for Neo.',
    '',
    '## Language routes',
    '',
  ]
  if (!input.listed) {
    const message = input.listError || 'model list missing'
    console.warn('[model-verify]', message)
    lines.push(`- The model list could not be read: ${message}`)
    missing.push('openrouter-list')
  } else {
    const rows = new Map(input.listed.map((row) => [row.id, row]))
    for (const id of routedModelIds()) {
      const row = rows.get(id)
      if (!row) {
        missing.push(id)
        lines.push(`- MISSING ${id}`)
        continue
      }
      if (row.deprecated) {
        deprecated.push(id)
        lines.push(`- DEPRECATED ${id}`)
        continue
      }
      lines.push(`- present ${id}`)
    }
    lines.push('', '## Newer successors (report only)', '')
    for (const item of SUCCESSORS) {
      if (routedModelIds().includes(item.routed)) lines.push(`- ${item.routed}: ${item.note}`)
    }
    lines.push('- Claude Haiku 4.5 is not a routed id. Research names Haiku 5.5. No change.')
  }
  lines.push('', '## Video registry against catalogued endpoints', '')
  const byId = new Map(input.endpoints.map((row) => [row.registryId, row.note]))
  for (const entry of VIDEO_EXPERT_REGISTRY) {
    const key = registryKey(entry)
    if (entry.status === 'retired') {
      lines.push(`- ${key} retired, not fetched`)
      continue
    }
    lines.push(`- ${key} ${byId.get(key) ?? 'no schema note'}`)
  }
  lines.push('', '## Unverified fields', '')
  for (const field of unverifiedRegistryFields()) {
    lines.push(`- ${field.id} ${field.field} (${field.source_tier})`)
  }
  lines.push('', '## Proposed diff', '')
  if (!missing.length && !deprecated.length) {
    lines.push('None. Routed ids stay as they are.', '')
  } else {
    lines.push('Not applied. Neo decides.', '')
    for (const id of missing) {
      const successor = id === 'x-ai/grok-4' ? ' Research names x-ai/grok-4.7.' : ''
      lines.push(`- ${id} is missing from the model list.${successor}`)
    }
    for (const id of deprecated) lines.push(`- ${id} is marked deprecated.`)
    lines.push('')
  }
  return { markdown: lines.join('\n'), missing, deprecated }
}
