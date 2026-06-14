export interface JobStreamEvent {
  status: string
  progress?: number
  message?: string
  outputUrl?: string
  error?: string
}

type Handlers = {
  onProgress?: (data: JobStreamEvent) => void
  onComplete?: (outputUrl: string, data: JobStreamEvent) => void
  onFailed?: (error: string, data: JobStreamEvent) => void
  onClose?: () => void
}

const TERMINAL_COMPLETE = new Set(['complete', 'COMPLETE', 'COMPLETED'])
const TERMINAL_FAILED = new Set(['failed', 'FAILED'])

function mapStatusJob(row: {
  status: string
  progressPct?: number | null
  statusMessage?: string | null
  outputUrl?: string | null
  errorMessage?: string | null
}): JobStreamEvent {
  const status = row.status === 'COMPLETE' ? 'complete'
    : row.status === 'FAILED' ? 'failed'
    : row.status === 'QUEUED' ? 'queued'
    : 'processing'
  return {
    status,
    progress: row.progressPct ?? undefined,
    message: row.statusMessage ?? undefined,
    outputUrl: row.outputUrl ?? undefined,
    error: row.errorMessage ?? undefined,
  }
}

function handleEvent(data: JobStreamEvent, handlers: Handlers, cleanup: () => void): void {
  handlers.onProgress?.(data)

  if (TERMINAL_COMPLETE.has(data.status) && data.outputUrl) {
    handlers.onComplete?.(data.outputUrl, data)
    cleanup()
    return
  }
  if (TERMINAL_FAILED.has(data.status)) {
    handlers.onFailed?.(data.error ?? 'Generation failed', data)
    cleanup()
  }
}

/**
 * SSE with automatic reconnect (Last-Event-ID) and polling fallback when SSE fails.
 * Returns cleanup — call on unmount or cancel.
 */
export function subscribeJobStream(jobId: string, handlers: Handlers): () => void {
  let evtSource: EventSource | null = null
  let pollTimer: ReturnType<typeof setInterval> | null = null
  let errorTimer: ReturnType<typeof setTimeout> | null = null
  let lastEventId = 0
  let closed = false

  const cleanup = () => {
    if (closed) return
    closed = true
    evtSource?.close()
    evtSource = null
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = null
    if (errorTimer) clearTimeout(errorTimer)
    errorTimer = null
    handlers.onClose?.()
  }

  const startPolling = () => {
    if (closed || pollTimer) return
    evtSource?.close()
    evtSource = null

    pollTimer = setInterval(() => {
      void fetch(`/api/jobs/${jobId}/status`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : null))
        .then((row) => {
          if (!row || closed) return
          handleEvent(mapStatusJob(row), handlers, cleanup)
        })
        .catch(() => {})
    }, 5_000)
  }

  let sseFailures = 0

  const startSSE = () => {
    if (closed) return
    evtSource?.close()
    const url = `/api/jobs/${jobId}/stream?lastEventId=${lastEventId}`
    evtSource = new EventSource(url)

    evtSource.onmessage = (e) => {
      sseFailures = 0
      try {
        const data = JSON.parse(e.data) as JobStreamEvent
        const parsedId = parseInt(e.lastEventId || '0', 10)
        if (parsedId > lastEventId) lastEventId = parsedId
        handleEvent(data, handlers, cleanup)
      } catch {
        // ignore malformed payloads
      }
    }

    evtSource.onerror = () => {
      if (closed) return
      evtSource?.close()
      evtSource = null
      sseFailures += 1
      if (errorTimer) clearTimeout(errorTimer)
      errorTimer = setTimeout(() => {
        if (closed) return
        if (sseFailures >= 3) {
          startPolling()
          return
        }
        startSSE()
      }, 3_000)
    }
  }

  startSSE()
  return cleanup
}
