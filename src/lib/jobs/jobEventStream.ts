import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { JobEvent } from '@/lib/queue/events'
import { parseProgressEvents, type JobProgressEvent } from '@/lib/jobs/jobProgressEvents'

const TERMINAL = new Set(['COMPLETE', 'FAILED', 'CANCELLED'])
const ROTATE_MS = 280_000
const HEARTBEAT_MS = 25_000
const POLL_MS = 1_000

const STATUS_MAP: Record<string, JobEvent['status']> = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

function parseLastEventId(request: NextRequest): number {
  const fromQuery = request.nextUrl.searchParams.get('lastEventId')
  const fromHeader = request.headers.get('last-event-id')
  const raw = fromQuery ?? fromHeader ?? '0'
  const n = parseInt(raw, 10)
  return Number.isFinite(n) && n >= 0 ? n : 0
}

function progressEventToJobEvent(jobId: string, event: JobProgressEvent, job: {
  status: string
  progressPct: number | null
  outputUrl: string | null
  outputUrls: string[] | null
  errorMessage: string | null
}): JobEvent {
  const mapped = STATUS_MAP[job.status] ?? 'processing'
  return {
    jobId,
    status: mapped,
    progress: event.pct ?? job.progressPct ?? undefined,
    message: event.detail ?? undefined,
    outputUrl: job.outputUrl ?? undefined,
    outputUrls: job.outputUrls?.length ? job.outputUrls : undefined,
    error: job.errorMessage ?? undefined,
  }
}

function snapshotToJobEvent(
  jobId: string,
  job: {
    status: string
    progressPct: number | null
    outputUrl: string | null
    outputUrls: string[] | null
    errorMessage: string | null
    statusMessage: string | null
  },
): JobEvent {
  return {
    jobId,
    status: STATUS_MAP[job.status] ?? 'processing',
    progress: job.progressPct ?? undefined,
    message: job.statusMessage ?? undefined,
    outputUrl: job.outputUrl ?? undefined,
    outputUrls: job.outputUrls?.length ? job.outputUrls : undefined,
    error: job.errorMessage ?? undefined,
  }
}

/** DB-polling SSE with heartbeat, Last-Event-ID, and proactive rotation before Vercel 300s ceiling. */
export function createJobEventStream(request: NextRequest, jobId: string, userId: string): ReadableStream {
  const encoder = new TextEncoder()
  let lastEventId = parseLastEventId(request)

  return new ReadableStream({
    start(controller) {
      let closed = false
      let missingPolls = 0
      let pollTimer: ReturnType<typeof setInterval> | undefined
      let heartbeat: ReturnType<typeof setInterval> | undefined
      let rotateTimer: ReturnType<typeof setTimeout> | undefined
      let lastSnapshotKey = ''

      const cleanup = () => {
        if (closed) return
        closed = true
        if (pollTimer) clearInterval(pollTimer)
        if (heartbeat) clearInterval(heartbeat)
        if (rotateTimer) clearTimeout(rotateTimer)
        try {
          controller.close()
        } catch {
          // already closed
        }
      }

      const sendId = (id: number, data: JobEvent) => {
        if (closed) return
        try {
          controller.enqueue(
            encoder.encode(`id:${id}\ndata:${JSON.stringify(data)}\n\n`),
          )
        } catch {
          cleanup()
        }
      }

      const poll = async () => {
        if (closed) return
        try {
          const job = await db.renderJob.findFirst({
            where: { id: jobId, userId },
            select: {
              status: true,
              progressPct: true,
              outputUrl: true,
              outputUrls: true,
              errorMessage: true,
              statusMessage: true,
              metadata: true,
            },
          })

          if (!job) {
            missingPolls += 1
            if (missingPolls < 4) return
            sendId(lastEventId + 1, { jobId, status: 'failed', error: 'Job not found' })
            cleanup()
            return
          }
          missingPolls = 0

          const events = parseProgressEvents(job.metadata)
          for (const event of events) {
            if (event.id > lastEventId) {
              sendId(event.id, progressEventToJobEvent(jobId, event, job))
              lastEventId = event.id
            }
          }

          // Fallback for jobs without progressEvents (simple generate, legacy rows).
          if (events.length === 0) {
            const snapshotKey = `${job.status}|${job.progressPct ?? ''}|${job.statusMessage ?? ''}|${job.outputUrl ?? ''}`
            if (snapshotKey !== lastSnapshotKey) {
              lastSnapshotKey = snapshotKey
              const snapId = lastEventId + 1
              sendId(snapId, snapshotToJobEvent(jobId, job))
              lastEventId = snapId
            }
          }

          if (TERMINAL.has(job.status)) cleanup()
        } catch {
          // transient DB error — keep polling
        }
      }

      void poll()
      pollTimer = setInterval(poll, POLL_MS)

      heartbeat = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          cleanup()
        }
      }, HEARTBEAT_MS)

      rotateTimer = setTimeout(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(': rotate\n\n'))
        } catch {
          // ignore
        }
        cleanup()
      }, ROTATE_MS)

      request.signal.addEventListener('abort', cleanup)
    },
  })
}

export function jobStreamResponseHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  }
}
