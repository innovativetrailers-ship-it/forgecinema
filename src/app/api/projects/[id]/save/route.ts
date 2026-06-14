import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const { recipe } = body

  try {
    const existing = await db.project.findUnique({ where: { id }, select: { userId: true } })
    if (existing && existing.userId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const durationSeconds =
      recipe && typeof recipe.durationSeconds === 'number' ? recipe.durationSeconds : undefined
    const fps = recipe && typeof recipe.fps === 'number' ? recipe.fps : undefined
    const resolution =
      recipe?.resolution && typeof recipe.resolution.width === 'number'
        ? `${recipe.resolution.width}x${recipe.resolution.height}`
        : undefined

    const updated = await db.project.upsert({
      where: { id },
      create: {
        id,
        userId,
        title: 'Untitled Project',
        timelineJson: recipe ?? undefined,
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        ...(fps !== undefined ? { fps } : {}),
        ...(resolution ? { resolution } : {}),
      },
      update: {
        timelineJson: recipe ?? undefined,
        updatedAt: new Date(),
        ...(durationSeconds !== undefined ? { durationSeconds } : {}),
        ...(fps !== undefined ? { fps } : {}),
        ...(resolution ? { resolution } : {}),
      },
    })

    return NextResponse.json({ project: updated })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to save project'
    console.error('[projects/save]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
