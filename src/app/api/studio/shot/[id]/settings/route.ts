import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'

const schema = z.object({
  lipSyncEnabled: z.boolean().optional(),
  lipSyncModel: z.string().nullable().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const body = schema.parse(await req.json())

  const clip = await db.studioClip.findUnique({
    where: { id },
    include: { scene: { include: { project: { select: { userId: true } } } } },
  })
  if (!clip || clip.scene.project.userId !== userId) {
    return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
  }

  const updated = await db.studioClip.update({
    where: { id },
    data: {
      ...(body.lipSyncEnabled !== undefined ? { lipSyncEnabled: body.lipSyncEnabled } : {}),
      ...(body.lipSyncModel !== undefined ? { lipSyncModel: body.lipSyncModel } : {}),
    },
  })

  return NextResponse.json({ clip: updated })
}
