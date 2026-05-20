import { NextRequest } from 'next/server'
import { generationProgressStream } from '@/lib/routing/generation-stream'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params
  return generationProgressStream(req, projectId)
}
