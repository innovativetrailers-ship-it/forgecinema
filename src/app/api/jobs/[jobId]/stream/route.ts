import { NextRequest } from 'next/server'
import { subscribeToJob } from '@/lib/queue/events'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { jobId } = await params

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      const send = (data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
        } catch {
          // Client disconnected
        }
      }

      // Send initial ping
      send({ type: 'connected', jobId })

      const unsubscribe = subscribeToJob(
        jobId,
        (event) => {
          send(event)
        },
        () => {
          try {
            controller.close()
          } catch {
            // Already closed
          }
        }
      )

      // Clean up on client disconnect
      request.signal.addEventListener('abort', () => {
        unsubscribe()
        try {
          controller.close()
        } catch {
          // Already closed
        }
      })
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
