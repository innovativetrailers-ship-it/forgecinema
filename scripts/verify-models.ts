import { writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const core = require('@cinema/core') as {
  reportModelVerification: (input: {
    listed: Array<{ id: string; deprecated?: boolean }> | null
    listError?: string
    endpoints: Array<{ registryId: string; note: string }>
  }) => { markdown: string; missing: string[]; deprecated: string[] }
  VIDEO_EXPERT_REGISTRY: Array<{
    id: string
    gateway: string
    status: string
    catalogKey: string | null
    paramNames: string[]
  }>
  ENDPOINT_CATALOG?: Record<string, string>
}
const catalog = require('../packages/core/dist/logic/endpointCatalog.js') as { ENDPOINT_CATALOG: Record<string, string> }

function propertyNames(schema: unknown): string[] {
  if (!schema || typeof schema !== 'object') return []
  const names = new Set<string>()
  const components = (schema as { components?: { schemas?: Record<string, { properties?: Record<string, unknown> }> } }).components
  for (const item of Object.values(components?.schemas ?? {})) {
    for (const key of Object.keys(item.properties ?? {})) names.add(key)
  }
  return [...names]
}

let listed: Array<{ id: string; deprecated?: boolean }> | null = null
let listError: string | undefined
try {
  const response = await fetch('https://openrouter.ai/api/v1/models')
  if (!response.ok) throw new Error(`model list returned ${response.status}`)
  const body = await response.json() as { data?: Array<{ id?: string; deprecated?: boolean }> }
  listed = (body.data ?? []).filter((row): row is { id: string; deprecated?: boolean } => Boolean(row.id))
} catch (err) {
  listError = err instanceof Error ? err.message : String(err)
  console.warn('[model-verify]', listError)
}

const endpoints: Array<{ registryId: string; note: string }> = []
for (const entry of core.VIDEO_EXPERT_REGISTRY) {
  const registryId = `${entry.id}@${entry.gateway}`
  if (entry.status === 'retired') continue
  if (!entry.catalogKey) {
    endpoints.push({ registryId, note: 'has no catalogued endpoint, not fetched' })
    continue
  }
  const endpoint = catalog.ENDPOINT_CATALOG[entry.catalogKey]
  if (!endpoint) {
    endpoints.push({ registryId, note: `catalog key ${entry.catalogKey} is not in the endpoint catalog` })
    continue
  }
  try {
    const response = await fetch(`https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=${endpoint}`)
    if (!response.ok) {
      endpoints.push({ registryId, note: `schema fetch ${response.status}` })
      continue
    }
    const live = new Set(propertyNames(await response.json()))
    const absent = entry.paramNames.filter((name) => live.size > 0 && !live.has(name))
    endpoints.push({
      registryId,
      note: `schema properties ${live.size}; registry names missing from schema: ${absent.join(', ') || 'none'}`,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.warn('[model-verify]', registryId, message)
    endpoints.push({ registryId, note: `schema fetch failed: ${message}` })
  }
}

const result = core.reportModelVerification({ listed, listError, endpoints })
const path = 'docs/model-verification-2026-10-16.md'
writeFileSync(path, result.markdown)
writeFileSync('docs/model-route-cache.json', JSON.stringify({
  checkedAt: '2026-10-16',
  missing: result.missing.filter((id) => id !== 'openrouter-list'),
  deprecated: result.deprecated,
}, null, 2) + '\n')
console.log(`wrote ${path}`)
console.log(`missing ${result.missing.length}, deprecated ${result.deprecated.length}`)
if (result.missing.length || result.deprecated.length) process.exit(1)
