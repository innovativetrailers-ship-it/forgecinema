import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { createJobEventStream, jobStreamResponseHeaders } from '@/lib/jobs/jobEventStream'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const session = await auth()
  const userId = request.headers.get('x-user-id') ?? session?.user?.id
  if (!userId) {
    return new Response('Unauthorized', { status: 401 })
  }

  const { jobId } = await params
  const stream = createJobEventStream(request, jobId, userId)

  return new Response(stream, { headers: jobStreamResponseHeaders() })
}
