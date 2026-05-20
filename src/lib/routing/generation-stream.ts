import type { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { createRedisConnection, channelKey } from '@/lib/redis'

/** SSE stream for shot-list generation progress (Redis pub/sub). */
export async function generationProgressStream(
  req: NextRequest,
  projectId: string,
): Promise<Response> {
  const session = await auth()
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 })
  }

  const channel = channelKey(`swarm:${projectId}`)
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const sub = createRedisConnection()

      const cleanup = () => {
        sub.unsubscribe(channel).catch(() => {})
        sub.quit().catch(() => {})
      }

      req.signal.addEventListener('abort', cleanup)

      sub.subscribe(channel, (err) => {
        if (err) {
          controller.error(err)
          cleanup()
        }
      })

      sub.on('message', (_chan: string, message: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${message}\n\n`))
          const parsed = JSON.parse(message) as { event?: string }
          if (parsed.event === 'longform_complete' || parsed.event === 'complete') {
            cleanup()
            controller.close()
          }
        } catch {
          // ignore malformed messages
        }
      })

      sub.on('error', (err: Error) => {
        controller.error(err)
        cleanup()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
