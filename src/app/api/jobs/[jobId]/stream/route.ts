import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import type { JobEvent } from '@/lib/queue/events'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
// SSE must outlive multi-minute generations; cap at the platform max.
export const maxDuration = 300

const TERMINAL = new Set(['COMPLETE', 'FAILED', 'CANCELLED'])

const STATUS_MAP: Record<string, JobEvent['status']> = {
  QUEUED: 'queued',
  PROCESSING: 'processing',
  COMPLETE: 'complete',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
}

// DB-polling SSE: emits the current job state immediately on connect (so jobs
// that already finished resolve instantly) then polls until terminal. This
// avoids the missed-event race and Redis pub/sub fragility on serverless.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { jobId } = await params
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    start(controller) {
      let closed = false
      let pollTimer: ReturnType<typeof setInterval> | undefined
      let keepAlive: ReturnType<typeof setInterval> | undefined

      const cleanup = () => {
        if (closed) return
        closed = true
        if (pollTimer) clearInterval(pollTimer)
        if (keepAlive) clearInterval(keepAlive)
        try {
          controller.close()
        } catch {
          // already closed
        }
      }

      const send = (data: JobEvent) => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
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
            },
          })

          if (!job) {
            send({ jobId, status: 'failed', error: 'Job not found' })
            cleanup()
            return
          }

          send({
            jobId,
            status: STATUS_MAP[job.status] ?? 'processing',
            progress: job.progressPct ?? 0,
            outputUrl: job.outputUrl ?? undefined,
            outputUrls: job.outputUrls?.length ? job.outputUrls : undefined,
            error: job.errorMessage ?? undefined,
          })

          if (TERMINAL.has(job.status)) cleanup()
        } catch {
          // transient DB error — keep polling
        }
      }

      // Emit initial state right away, then poll.
      void poll()
      pollTimer = setInterval(poll, 2000)
      keepAlive = setInterval(() => {
        if (closed) return
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`))
        } catch {
          cleanup()
        }
      }, 15000)

      request.signal.addEventListener('abort', cleanup)
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
