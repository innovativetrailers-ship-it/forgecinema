/**
 * Zero-cost FAL endpoint probes — shared by verify-fal-endpoints.mjs and preflight gate.
 * Uses invalid payloads so queue submit returns 422 (never queues real generations).
 */

export type ProbeStatus =
  | 'VALID'
  | 'VALID_QUEUED'
  | 'DEAD'
  | 'DEPRECATED'
  | 'LOCKED'
  | 'AUTH_ERROR'
  | 'UNKNOWN'
  | 'NETWORK_ERROR'

const LOCK_RE = /user is locked|exhausted balance/i

/** Omit prompt entirely — every Pydantic schema rejects missing key with 422. */
export const FAL_PROBE_BODY = {} as const

export function isFalLockDetail(detail: unknown): boolean {
  const text = typeof detail === 'string' ? detail : JSON.stringify(detail ?? '')
  return LOCK_RE.test(text)
}

export interface ProbeResult {
  endpoint: string
  status: ProbeStatus
  code?: number
  detail?: unknown
  requestId?: string
}

const probeCache = new Map<string, { status: ProbeStatus; code?: number; cachedAt: number }>()
const PROBE_CACHE_TTL_MS = 30 * 60 * 1000

function isDeprecatedBody(body: unknown): boolean {
  const text = JSON.stringify(body ?? {}).toLowerCase()
  return text.includes('deprecated') || text.includes('no longer supported')
}

async function runProbe(endpoint: string, falKey: string): Promise<ProbeResult> {
  const res = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Key ${falKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(FAL_PROBE_BODY),
  })

  const body = await res.json().catch(() => ({}))

  if (isDeprecatedBody(body)) {
    return { endpoint, status: 'DEPRECATED', code: res.status, detail: body.detail ?? body }
  }
  if (res.status === 404) {
    return { endpoint, status: 'DEAD', code: 404, detail: body.detail }
  }
  if (res.status === 403 && isFalLockDetail(body.detail ?? body)) {
    return { endpoint, status: 'LOCKED', code: 403, detail: body.detail ?? body }
  }
  if (res.status === 401 || res.status === 403) {
    return { endpoint, status: 'AUTH_ERROR', code: res.status, detail: body.detail ?? body }
  }
  if (res.status === 422 || res.status === 400) {
    return { endpoint, status: 'VALID', code: res.status }
  }
  if (res.status === 200) {
    // Some endpoints queue even invalid probes — log but treat as reachable (preflight only).
    return {
      endpoint,
      status: 'VALID_QUEUED',
      code: res.status,
      requestId: (body as { request_id?: string }).request_id,
    }
  }
  if (res.status === 410) {
    return { endpoint, status: 'DEPRECATED', code: 410, detail: body.detail ?? body }
  }
  return { endpoint, status: 'UNKNOWN', code: res.status, detail: body }
}

export async function probeEndpoint(endpoint: string, falKey?: string): Promise<ProbeResult> {
  const key = falKey ?? process.env.FAL_KEY ?? process.env.FAL_API_KEY
  if (!key) {
    return { endpoint, status: 'AUTH_ERROR', detail: 'FAL_KEY not configured' }
  }

  const cached = probeCache.get(endpoint)
  if (cached && Date.now() - cached.cachedAt < PROBE_CACHE_TTL_MS) {
    return { endpoint, status: cached.status, code: cached.code }
  }

  try {
    const result = await runProbe(endpoint, key)
    probeCache.set(endpoint, {
      status: result.status,
      code: result.code,
      cachedAt: Date.now(),
    })
    return result
  } catch (err) {
    return {
      endpoint,
      status: 'NETWORK_ERROR',
      detail: err instanceof Error ? err.message : String(err),
    }
  }
}
