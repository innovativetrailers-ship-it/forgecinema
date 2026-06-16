import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  context: { params: Promise<unknown> },
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = (await context.params) as { id: string }
  const project = await db.project.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      title: true,
      description: true,
      thumbnailUrl: true,
      timelineJson: true,
      durationSeconds: true,
      fps: true,
      resolution: true,
      status: true,
      isPublic: true,
      musicUrl: true,
      ambienceUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  if (!project || project.userId !== userId) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  }

  return NextResponse.json({
    ...project,
    name: project.title,
    recipe: project.timelineJson,
  })
}
