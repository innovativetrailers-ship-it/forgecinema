import { NextRequest } from 'next/server'
import { generationProgressStream } from '@/lib/routing/generation-stream'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  const response = await generationProgressStream(req, projectId)
  response.headers.set('Deprecation', 'true')
  response.headers.set('Link', '</api/generate/{projectId}/stream>; rel="successor-version"')
  return response
}
