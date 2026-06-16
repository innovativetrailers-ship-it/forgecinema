/**
 * FAL queue — submit + poll using URLs returned by FAL (never reconstruct paths).
 */

import { fal } from '@fal-ai/client'
import { extractFalLockFromError, formatFalBalanceError } from '@/lib/fal/accountStatus'
import { classifyFalError, FalValidationError, throwIfFalValidation } from '@/lib/fal/falErrors'
import { getFalKey } from '@/lib/config/keys'

type LogLevel = 'info' | 'warn' | 'error'

export function falLog(
  level: LogLevel,
  event: string,
  fields: Record<string, unknown>,
): void {
  const entry = JSON.stringify({
    ts: new Date().toISOString(),
    service: 'fal',
    event,
    ...fields,
  })
  if (level === 'error') console.error(entry)
  else if (level === 'warn') console.warn(entry)
  else console.log(entry)
}

export interface FalSubmission {
  requestId: string
  statusUrl: string
  responseUrl: string
  cancelUrl: string
  endpoint: string
  submittedAt?: number
}

export interface FalResult {
  data: Record<string, unknown>
  requestId: string
  durationMs?: number
}

export type FalQueueStatus = 'IN_QUEUE' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED'

interface FalSubmitResponse {
  request_id?: string
  status_url?: string
  response_url?: string
  cancel_url?: string
}

const MAX_CONSECUTIVE_ERRORS = 3

/**
 * Global video-generation lock — one FAL video job at a time per process.
 * Probes and non-video endpoints bypass via withVideoGenLock({ bypassLock: true }).
 */
class GenerationSemaphore {
  private queue: Array<(release: () => void) => void> = []
  private locked = false

  async acquire(): Promise<() => void> {
    if (!this.locked) {
      this.locked = true
      return () => this._release()
    }
    return new Promise((resolve) => {
      this.queue.push((release) => resolve(release))
    })
  }

  private _release(): void {
    const next = this.queue.shift()
    if (next) {
      next(() => this._release())
    } else {
      this.locked = false
    }
  }

  get isLocked(): boolean {
    return this.locked
  }

  get queueDepth(): number {
    return this.queue.length
  }
}

const videoGenSemaphore = new GenerationSemaphore()

const LOG_EVERY_N_POLLS = 5

const PROMPTLESS_ENDPOINT_FRAGMENTS = [
  'upscale',
  'motion-brush',
  'reframe',
  'video-to-video',
  'background-removal',
  'ffmpeg',
  'extract-frame',
  'extract_last_frame',
  'whisper',
  'rembg',
]

const VIDEO_LOCK_SKIP_FRAGMENTS = [
  'gemini',
  'flux',
  'ffmpeg',
  'whisper',
  'instant',
  'codeformer',
  'face-swap',
  'stable-audio',
  'rife-interpolation',
  'dwpose',
  'extract-frame',
  'rembg',
  'sadtalker',
]

export function isVideoGenerationEndpoint(endpoint: string): boolean {
  if (PROMPTLESS_ENDPOINT_FRAGMENTS.some((p) => endpoint.includes(p))) return false
  if (VIDEO_LOCK_SKIP_FRAGMENTS.some((p) => endpoint.includes(p))) return false
  const id = endpoint.toLowerCase()
  return (
    id.includes('text-to-video') ||
    id.includes('image-to-video') ||
    id.includes('/veo3') ||
    id.includes('kling-video') ||
    id.includes('seedance') ||
    id.includes('hunyuan-video') ||
    id.includes('luma-dream-machine') ||
    id.includes('pixverse') ||
    id.includes('hailuo') ||
    id.includes('pika/') ||
    id.includes('wan/v') ||
    id.includes('happy-horse')
  )
}

export async function withVideoGenLock<T>(
  fn: () => Promise<T>,
  options?: { bypassLock?: boolean; endpoint?: string; jobId?: string },
): Promise<T> {
  const endpoint = options?.endpoint ?? ''
  if (options?.bypassLock || !isVideoGenerationEndpoint(endpoint)) {
    return fn()
  }

  falLog('info', 'fal_queue_acquire', {
    endpoint,
    jobId: options?.jobId,
    semaphoreQ: videoGenSemaphore.queueDepth,
    locked: videoGenSemaphore.isLocked,
  })

  const release = await videoGenSemaphore.acquire()

  falLog('info', 'fal_queue_acquired', {
    endpoint,
    jobId: options?.jobId,
    queueDepth: videoGenSemaphore.queueDepth,
  })

  try {
    return await fn()
  } finally {
    release()
    falLog('info', 'fal_queue_released', {
      endpoint,
      jobId: options?.jobId,
      queueDepth: videoGenSemaphore.queueDepth,
    })
  }
}

const ENDPOINT_TIMEOUT_MS: Record<string, number> = {
  'fal-ai/hunyuan-video':           600_000,
  'fal-ai/veo3.1':                  420_000,
  'fal-ai/veo3.1/fast':             420_000,
  'fal-ai/veo3':                    420_000,
  'wan/v2.6/text-to-video':         300_000,
  'wan/v2.6/image-to-video':        300_000,
  'fal-ai/ltx-2.3/text-to-video':   240_000,
  'fal-ai/ltx-2.3/text-to-video/fast': 240_000,
  'fal-ai/ltx-2.3/image-to-video': 240_000,
  'fal-ai/gemini-25-flash-image':   120_000,
  'fal-ai/gemini-3-pro-image-preview': 180_000,
  'fal-ai/kling-video/v3/pro/text-to-video': 600_000,
  'fal-ai/kling-video/v3/pro/image-to-video': 600_000,
  'bytedance/seedance-2.0/text-to-video': 600_000,
  'bytedance/seedance-2.0/image-to-video': 600_000,
}

const DEFAULT_ENDPOINT_TIMEOUT_MS = 300_000

export function getEndpointTimeout(endpoint: string): number {
  if (ENDPOINT_TIMEOUT_MS[endpoint]) return ENDPOINT_TIMEOUT_MS[endpoint]
  for (const [key, ms] of Object.entries(ENDPOINT_TIMEOUT_MS)) {
    if (endpoint.startsWith(key) || endpoint.includes(key)) return ms
  }
  return DEFAULT_ENDPOINT_TIMEOUT_MS
}

/** @deprecated Use getEndpointTimeout — keyed by FAL endpoint id. */
export function getModelTimeout(endpoint: string): number {
  return getEndpointTimeout(endpoint)
}

function assertGenerationPrompt(
  endpoint: string,
  input: Record<string, unknown>,
  jobId?: string,
): void {
  const isPromptless = PROMPTLESS_ENDPOINT_FRAGMENTS.some((p) => endpoint.includes(p))
  if (isPromptless) return

  const p = input.prompt as string | undefined
  const mp = input.multi_prompt as string[] | undefined
  const ps = input.prompts as string[] | undefined

  const hasPrompt =
    (p && p.trim().length >= 3) ||
    (mp && mp.some((x) => x?.trim().length >= 3)) ||
    (ps && ps.some((x) => x?.trim().length >= 3))

  if (!hasPrompt) {
    falLog('error', 'fal_submit_blocked', {
      endpoint,
      jobId,
      reason: 'no_prompt',
      promptValue: p ?? '(undefined)',
    })
    throw new Error(
      `[FAL] Refusing to submit to ${endpoint}: no usable prompt found ` +
      `(checked prompt / multi_prompt / prompts). Check shot plan → payload adapter chain.`,
    )
  }
}

function authHeaders(): Record<string, string> {
  return { Authorization: `Key ${getFalKey()}` }
}

export function serializeFalSubmission(submission: FalSubmission): string {
  return JSON.stringify(submission)
}

export function parseFalSubmission(raw: string): FalSubmission | null {
  try {
    const parsed = JSON.parse(raw) as FalSubmission
    if (parsed?.requestId && parsed?.statusUrl && parsed?.responseUrl && parsed?.endpoint) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Submit to FAL queue and return all URLs from the response.
 */
export async function submitToFal(
  endpoint: string,
  input: Record<string, unknown>,
  jobId?: string,
  source?: string,
): Promise<FalSubmission> {
  const { assertGenerationNotPaused } = await import('@/lib/generation/pause')
  assertGenerationNotPaused(endpoint)

  const promptHead = String(input.prompt ?? '').slice(0, 40)
  const caller = source ?? new Error().stack?.split('\n')[3]?.trim() ?? 'UNKNOWN'

  fal.config({ credentials: getFalKey() })
  assertGenerationPrompt(endpoint, input, jobId)

  falLog('info', 'fal_submit_start', {
    endpoint,
    jobId,
    caller,
    promptHead,
    prompt: (input.prompt as string | undefined)?.slice(0, 100),
    duration: input.duration,
    aspectRatio: input.aspect_ratio ?? input.aspectRatio,
    hasImage: !!(input.image_url ?? input.start_image_url ?? input.video_url),
    semaphoreQ: videoGenSemaphore.queueDepth,
  })
  console.log('[fal_submit]', JSON.stringify({ endpoint, caller, promptHead, jobId }))

  let res: FalSubmitResponse
  try {
    res = await fal.queue.submit(endpoint, { input }) as FalSubmitResponse
  } catch (err) {
    const lock = extractFalLockFromError(err)
    if (lock) throw new Error(formatFalBalanceError(lock) + ` (${endpoint})`)
    const classified = classifyFalError(err, endpoint)
    if (!(classified instanceof FalValidationError)) {
      falLog('error', 'fal_submit_failed', {
        endpoint,
        jobId,
        error: classified.message,
      })
    }
    throw classified
  }

  const requestId = res.request_id
  const statusUrl = res.status_url
  const responseUrl = res.response_url

  if (!requestId || !statusUrl || !responseUrl) {
    falLog('error', 'fal_submit_incomplete', {
      endpoint,
      jobId,
      response: JSON.stringify(res).slice(0, 200),
    })
    throw new Error(
      `FAL submit to ${endpoint} returned incomplete submission: ${JSON.stringify(res)}`,
    )
  }

  falLog('info', 'fal_submit_ok', {
    endpoint,
    jobId,
    requestId,
    statusUrl,
    semaphoreQ: videoGenSemaphore.queueDepth,
  })

  return {
    requestId,
    statusUrl,
    responseUrl,
    cancelUrl: res.cancel_url ?? '',
    endpoint,
    submittedAt: Date.now(),
  }
}

/**
 * Single status poll tick — for BullMQ worker loops.
 */
export async function pollFalStatusOnce(
  submission: FalSubmission,
): Promise<{ status: FalQueueStatus; data?: unknown; error?: string }> {
  const res = await fetch(submission.statusUrl, { headers: authHeaders() })

  if (res.status === 404) {
    return {
      status: 'FAILED',
      error:
        `FAL status URL returned 404 for request ${submission.requestId} ` +
        `on ${submission.endpoint}`,
    }
  }

  if (res.status === 410) {
    return { status: 'FAILED', error: `FAL endpoint ${submission.endpoint} is deprecated (410)` }
  }

  if (!res.ok) {
    return {
      status: 'FAILED',
      error: `FAL status check failed (HTTP ${res.status}) for ${submission.requestId}`,
    }
  }

  const body = await res.json() as Record<string, unknown>
  const status = String(body.status ?? '')

  if (status === 'COMPLETED') {
    const resultRes = await fetch(submission.responseUrl, { headers: authHeaders() })
    if (!resultRes.ok) {
      return {
        status: 'FAILED',
        error: `FAL result fetch failed (${resultRes.status}) for ${submission.requestId}`,
      }
    }
    const data = await resultRes.json() as Record<string, unknown>
    throwIfFalValidation(data.detail ?? data.error ?? data, submission.endpoint)
    const detail = data.detail
    if (detail === 'Not Found' || data.error) {
      return {
        status: 'FAILED',
        error: String(data.error ?? detail ?? 'FAL result error'),
      }
    }
    return { status: 'COMPLETED', data }
  }

  if (status === 'FAILED') {
    const detail = (body.error as string) ?? JSON.stringify(body)
    throwIfFalValidation(detail, submission.endpoint)
    return { status: 'FAILED', error: `FAL generation failed: ${detail}` }
  }

  if (status === 'IN_PROGRESS') return { status: 'IN_PROGRESS' }
  return { status: 'IN_QUEUE' }
}

/**
 * Poll until complete using FAL-provided status/response URLs.
 */
export async function pollFalResult(
  submission: FalSubmission,
  options?: {
    timeoutMs?: number
    pollIntervalMs?: number
    onProgress?: (pct: number, logs?: string, queuePosition?: number | string) => void
    jobHeartbeat?: () => void | Promise<void>
    jobId?: string
  },
): Promise<FalResult> {
  const timeout = options?.timeoutMs ?? 600_000
  const interval = options?.pollIntervalMs ?? 3_000
  const deadline = Date.now() + timeout
  const jobId = options?.jobId
  const submittedAt = submission.submittedAt ?? Date.now()
  let consecutiveErrors = 0
  let pollCount = 0

  falLog('info', 'fal_poll_start', {
    endpoint: submission.endpoint,
    requestId: submission.requestId,
    jobId,
    timeoutMs: timeout,
  })

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, interval))
    pollCount++
    await options?.jobHeartbeat?.()

    let statusBody: Record<string, unknown>
    try {
      const res = await fetch(submission.statusUrl, { headers: authHeaders() })

      if (res.status === 404) {
        falLog('error', 'fal_status_404', {
          endpoint: submission.endpoint,
          requestId: submission.requestId,
          jobId,
          detail: 'Status URL returned 404 — request may have expired',
        })
        throw new Error(
          `FAL status URL returned 404 for request ${submission.requestId} ` +
          `on ${submission.endpoint}`,
        )
      }

      if (res.status === 410) {
        falLog('error', 'fal_endpoint_deprecated', {
          endpoint: submission.endpoint,
          requestId: submission.requestId,
          jobId,
        })
        throw new Error(`FAL endpoint ${submission.endpoint} is deprecated (410)`)
      }

      if (!res.ok) {
        consecutiveErrors++
        falLog('warn', 'fal_status_error', {
          endpoint: submission.endpoint,
          requestId: submission.requestId,
          jobId,
          httpStatus: res.status,
          consecutive: consecutiveErrors,
        })
        if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
          throw new Error(
            `FAL status check failed ${MAX_CONSECUTIVE_ERRORS} times ` +
            `(HTTP ${res.status}) for ${submission.requestId}`,
          )
        }
        continue
      }

      consecutiveErrors = 0
      statusBody = await res.json() as Record<string, unknown>
    } catch (err) {
      if (err instanceof Error && (
        err.message.includes('404') ||
        err.message.includes('deprecated') ||
        err.message.includes('consecutive')
      )) {
        throw err
      }
      consecutiveErrors++
      if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) throw err
      continue
    }

    const status = String(statusBody.status ?? '')
    const pct = (statusBody.progress as number | undefined) ?? 0
    const queuePosition = statusBody.queue_position as number | undefined
    const logs = statusBody.logs as Array<{ message?: string }> | undefined
    const lastLog = logs?.slice(-1)[0]?.message
    options?.onProgress?.(pct, lastLog, queuePosition ?? 'n/a')

    if (
      pollCount % LOG_EVERY_N_POLLS === 0 ||
      status === 'COMPLETED' ||
      status === 'FAILED'
    ) {
      falLog('info', 'fal_poll_tick', {
        endpoint: submission.endpoint,
        requestId: submission.requestId,
        jobId,
        status,
        queue_position: queuePosition ?? 'n/a',
        pct: Math.round(pct * 100),
        elapsedMs: Date.now() - submittedAt,
        pollCount,
        lastLog: lastLog?.slice(0, 80),
      })
    }

    if (status === 'COMPLETED') {
      const resultRes = await fetch(submission.responseUrl, { headers: authHeaders() })
      if (!resultRes.ok) {
        falLog('error', 'fal_result_fetch_failed', {
          endpoint: submission.endpoint,
          requestId: submission.requestId,
          jobId,
          httpStatus: resultRes.status,
        })
        throw new Error(
          `FAL result fetch failed (${resultRes.status}) for ${submission.requestId}`,
        )
      }
      const data = await resultRes.json() as Record<string, unknown>
      throwIfFalValidation(data.detail ?? data.error ?? data, submission.endpoint)

      const durationMs = Date.now() - submittedAt

      falLog('info', 'fal_complete', {
        endpoint: submission.endpoint,
        requestId: submission.requestId,
        jobId,
        durationMs,
        durationSec: (durationMs / 1000).toFixed(1),
        hasVideo: !!(
          (data.video as { url?: string } | undefined)?.url ?? data.video_url
        ),
        hasImages: Array.isArray(data?.images) && data.images.length > 0,
        pollCount,
      })

      return { data, requestId: submission.requestId, durationMs }
    }

    if (status === 'FAILED') {
      const detail = (statusBody.error as string) ?? JSON.stringify(statusBody)
      throwIfFalValidation(detail, submission.endpoint)
      falLog('error', 'fal_generation_failed', {
        endpoint: submission.endpoint,
        requestId: submission.requestId,
        jobId,
        detail: detail.slice(0, 200),
        elapsedMs: Date.now() - submittedAt,
        pollCount,
      })
      throw new Error(`FAL generation failed: ${detail}`)
    }
  }

  falLog('error', 'fal_timeout', {
    endpoint: submission.endpoint,
    requestId: submission.requestId,
    jobId,
    timeoutMs: timeout,
    elapsedMs: Date.now() - submittedAt,
    pollCount,
  })

  throw new Error(
    `FAL generation timed out after ${timeout / 1000}s ` +
    `(request ${submission.requestId} on ${submission.endpoint})`,
  )
}

/** Submit + poll in one call. */
export async function runFalQueue(
  endpoint: string,
  input: Record<string, unknown>,
  options?: Parameters<typeof pollFalResult>[1],
): Promise<FalResult> {
  const submission = await submitToFal(endpoint, input)
  return pollFalResult(submission, options)
}
