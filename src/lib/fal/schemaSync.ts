/**
 * Schema-sync engine — payloads self-correct from FAL OpenAPI constraints.
 */

import { createHash } from 'node:crypto'
import type { Prisma } from '@/generated/prisma/client'
import { getFalKey } from '@/lib/config/keys'
import { db } from '@/lib/db'
import { falLog } from '@/lib/fal/falQueue'
import { probeEndpointExistence } from '@/lib/fal/registryProbe'
import { VIDEO_MODEL_REGISTRY } from '@/lib/models/registry'

const CONSTRAINT_TTL_MS = 24 * 3600_000
const RESOLUTION_RANK = ['480p', '580p', '720p', '1080p', '1440p', '2160p'] as const

const CANDIDATE_FORBIDDEN = [
  'duration',
  'resolution',
  'aspect_ratio',
  'image_url',
  'num_frames',
  'seconds',
  'video_length',
] as const

export class NoSchemaError extends Error {
  constructor(endpoint: string) {
    super(`No FAL schema available for ${endpoint}`)
    this.name = 'NoSchemaError'
  }
}

export class PayloadError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PayloadError'
  }
}

export interface ModelConstraints {
  endpoint: string
  required: string[]
  forbidden: string[]
  enums: Record<string, (string | number)[]>
  types: Record<string, 'string' | 'number' | 'boolean'>
  properties: string[]
  fetchedAt: number
  schemaHash: string
}

export interface SchemaShotIntent {
  prompt: string
  duration: number
  aspectRatio?: string
  resolution?: string
  anchorUrl?: string
  imageUrl?: string
  negativePrompt?: string
  quality?: string
  seed?: number
}

type JsonSchema = {
  type?: string
  enum?: (string | number)[]
  properties?: Record<string, JsonSchema>
  required?: string[]
  $ref?: string
}

function sha1(text: string): string {
  return createHash('sha1').update(text).digest('hex')
}

function normalizeResolution(value: string): string {
  const v = value.trim().toLowerCase()
  if (/^\d+p$/i.test(v)) return v
  if (/^\d+k$/i.test(v)) return v.replace(/k$/i, 'p')
  return v
}

function inputSchemaOf(openapi: Record<string, unknown>): JsonSchema {
  const components = openapi.components as { schemas?: Record<string, JsonSchema> } | undefined
  const fromComponent = components?.schemas?.Input ?? components?.schemas?.input
  if (fromComponent?.properties) return fromComponent

  const paths = openapi.paths as Record<
    string,
    Record<string, { requestBody?: { content?: Record<string, { schema?: JsonSchema }> } }>
  > | undefined

  if (paths) {
    for (const methods of Object.values(paths)) {
      for (const op of Object.values(methods)) {
        const schema = op.requestBody?.content?.['application/json']?.schema
        if (schema?.$ref && components?.schemas) {
          const name = schema.$ref.split('/').pop()!
          const resolved = components.schemas[name]
          if (resolved?.properties) return resolved
        }
        if (schema?.properties) return schema
      }
    }
  }

  return { properties: {}, required: [] }
}

export async function fetchConstraints(endpoint: string): Promise<ModelConstraints> {
  const res = await fetch(
    `https://fal.ai/api/openapi/queue/openapi.json?endpoint_id=${encodeURIComponent(endpoint)}`,
    { headers: { Authorization: `Key ${getFalKey()}` } },
  )
  if (!res.ok) {
    throw new NoSchemaError(`${endpoint} (HTTP ${res.status})`)
  }

  const schema = await res.json() as Record<string, unknown>
  const input = inputSchemaOf(schema)
  const props = input.properties ?? {}
  const enums: ModelConstraints['enums'] = {}
  const types: ModelConstraints['types'] = {}

  for (const [k, v] of Object.entries(props)) {
    if (v.enum?.length) enums[k] = v.enum
    if (v.type) {
      types[k] = v.type === 'integer' ? 'number' : (v.type as 'string' | 'boolean')
    }
  }

  const known = new Set(Object.keys(props))
  const forbidden = CANDIDATE_FORBIDDEN.filter((k) => !known.has(k))

  return {
    endpoint,
    required: input.required ?? [],
    forbidden,
    enums,
    types,
    properties: [...known],
    fetchedAt: Date.now(),
    schemaHash: sha1(JSON.stringify(input)),
  }
}

async function readStoredConstraints(endpoint: string): Promise<ModelConstraints | null> {
  const row = await db.modelConstraint.findUnique({ where: { endpoint } })
  if (!row) return null
  return row.json as unknown as ModelConstraints
}

export async function upsertConstraints(constraints: ModelConstraints): Promise<void> {
  const json = constraints as unknown as Prisma.InputJsonValue
  await db.modelConstraint.upsert({
    where: { endpoint: constraints.endpoint },
    create: {
      endpoint: constraints.endpoint,
      json,
      schemaHash: constraints.schemaHash,
      fetchedAt: new Date(constraints.fetchedAt),
    },
    update: {
      json,
      schemaHash: constraints.schemaHash,
      fetchedAt: new Date(constraints.fetchedAt),
    },
  })
}

export async function getConstraints(endpoint: string): Promise<ModelConstraints> {
  const row = await readStoredConstraints(endpoint)
  if (row && Date.now() - row.fetchedAt < CONSTRAINT_TTL_MS) return row

  const fresh = await fetchConstraints(endpoint).catch(() => row)
  if (fresh) await upsertConstraints(fresh)
  if (!fresh) throw new NoSchemaError(endpoint)
  return fresh
}

/** Bypass TTL — used after 422 validation or nightly drift refresh. */
export async function forceRefreshConstraints(endpoint: string): Promise<ModelConstraints> {
  const fresh = await fetchConstraints(endpoint)
  await upsertConstraints(fresh)
  return fresh
}

function logClamp(field: string, want: unknown, picked: unknown, endpoint: string): void {
  falLog('info', 'schema_clamp', { endpoint, field, want, picked })
}

function snapEnum(
  field: string,
  want: unknown,
  allowed: (string | number)[],
  endpoint: string,
): string | number {
  if (allowed.includes(want as string | number)) return want as string | number

  if (typeof allowed[0] === 'number') {
    const target = Number(want)
    const picked = allowed.reduce((a, b) =>
      Math.abs(Number(b) - target) < Math.abs(Number(a) - target) ? b : a,
    )
    logClamp(field, want, picked, endpoint)
    return picked
  }

  const wi = RESOLUTION_RANK.indexOf(normalizeResolution(String(want)) as typeof RESOLUTION_RANK[number])
  const allowedStr = allowed as string[]
  const picked =
    (wi >= 0
      ? allowedStr
          .filter((r) => {
            const ri = RESOLUTION_RANK.indexOf(normalizeResolution(r) as typeof RESOLUTION_RANK[number])
            return ri >= 0 && ri <= wi
          })
          .sort(
            (a, b) =>
              RESOLUTION_RANK.indexOf(normalizeResolution(b) as typeof RESOLUTION_RANK[number]) -
              RESOLUTION_RANK.indexOf(normalizeResolution(a) as typeof RESOLUTION_RANK[number]),
          )[0]
      : undefined) ?? allowedStr[0]

  logClamp(field, want, picked, endpoint)
  return picked
}

function coerce(value: unknown, type: 'string' | 'number' | 'boolean'): unknown {
  if (type === 'string') return String(value)
  if (type === 'number') return Number(value)
  if (type === 'boolean') return Boolean(value)
  return value
}

function pickProperty(
  candidates: string[],
  properties: Set<string>,
): string | undefined {
  return candidates.find((k) => properties.has(k))
}

function mapQualityToResolution(quality?: string): string {
  if (!quality) return '720p'
  const q = quality.toLowerCase()
  if (q === 'film' || q === 'film_grade' || q === 'cinematic' || q === '1080p') return '1080p'
  return '720p'
}

export async function buildPayload(
  endpoint: string,
  shot: SchemaShotIntent,
): Promise<Record<string, unknown>> {
  const C = await getConstraints(endpoint)
  const props = new Set(C.properties)

  const p: Record<string, unknown> = {}

  const promptKey = pickProperty(['prompt', 'text', 'prompt_text'], props) ?? 'prompt'
  p[promptKey] = shot.prompt.trim()

  const durationKey = pickProperty(['duration', 'seconds', 'video_length'], props)
  if (durationKey) p[durationKey] = shot.duration

  const aspectKey = pickProperty(['aspect_ratio', 'ratio'], props)
  if (aspectKey && shot.aspectRatio) p[aspectKey] = shot.aspectRatio

  const resolutionKey = pickProperty(['resolution'], props)
  if (resolutionKey) {
    p[resolutionKey] = shot.resolution ?? mapQualityToResolution(shot.quality)
  }

  const imageUrl = shot.anchorUrl ?? shot.imageUrl
  if (imageUrl) {
    const imageKey = pickProperty(
      ['image_url', 'image', 'init_image', 'start_image', 'start_image_url'],
      props,
    )
    if (imageKey) p[imageKey] = imageUrl
  }

  if (shot.negativePrompt && props.has('negative_prompt')) {
    p.negative_prompt = shot.negativePrompt
  }
  if (shot.seed !== undefined && props.has('seed')) {
    p.seed = shot.seed
  }

  for (const [f, allowed] of Object.entries(C.enums)) {
    if (f in p) p[f] = snapEnum(f, p[f], allowed, endpoint)
  }

  for (const [f, t] of Object.entries(C.types)) {
    if (f in p && p[f] != null) p[f] = coerce(p[f], t)
  }

  for (const k of C.forbidden) delete p[k]

  for (const k of C.required) {
    if (p[k] == null) throw new PayloadError(`${endpoint} requires ${k}`)
  }

  return p
}

export interface DriftRow {
  endpoint: string
  status: 'ok' | 'DEAD' | 'SCHEMA_CHANGED'
  newRequired: string[] | null
  schemaHash?: string
}

function diffRequired(before: string[], after: string[]): string[] {
  const prev = new Set(before)
  return after.filter((k) => !prev.has(k))
}

export async function endpointDrift(falKey?: string): Promise<DriftRow[]> {
  const key = falKey ?? getFalKey()
  const rows: DriftRow[] = []

  for (const entry of Object.values(VIDEO_MODEL_REGISTRY)) {
    if (entry.isExternal) continue
    const endpoints = [entry.falEndpoint, entry.i2vEndpoint].filter(
      (e): e is string => Boolean(e),
    )
    const seen = new Set<string>()

    for (const endpoint of endpoints) {
      if (seen.has(endpoint)) continue
      seen.add(endpoint)

      const live = await probeEndpointExistence(endpoint, key)
      const stored = await readStoredConstraints(endpoint)
      let fresh: ModelConstraints | null = null

      try {
        fresh = await fetchConstraints(endpoint)
        await upsertConstraints(fresh)
      } catch {
        fresh = null
      }

      const status: DriftRow['status'] = !live.alive
        ? 'DEAD'
        : fresh && stored && fresh.schemaHash !== stored.schemaHash
          ? 'SCHEMA_CHANGED'
          : 'ok'

      rows.push({
        endpoint,
        status,
        newRequired:
          fresh && stored ? diffRequired(stored.required, fresh.required) : null,
        schemaHash: fresh?.schemaHash,
      })
    }
  }

  const problems = rows.filter((r) => r.status !== 'ok')
  if (problems.length) {
    falLog('error', 'endpoint_drift', { problems })
  }

  return rows
}

/** Worker boot — refresh stale constraints in background. */
export async function refreshStaleConstraints(endpoints: string[]): Promise<void> {
  const stale = await Promise.all(
    endpoints.map(async (endpoint) => {
      const row = await readStoredConstraints(endpoint)
      if (!row || Date.now() - row.fetchedAt >= CONSTRAINT_TTL_MS) return endpoint
      return null
    }),
  )

  for (const endpoint of stale.filter((e): e is string => Boolean(e))) {
    fetchConstraints(endpoint)
      .then((c) => upsertConstraints(c))
      .catch(() => {})
  }
}
