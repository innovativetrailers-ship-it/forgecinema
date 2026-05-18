import { NextRequest, NextResponse } from 'next/server'
import { db } from '../../../../lib/db'
import { z } from 'zod'

const CreateReviewSchema = z.object({
  projectId: z.string(),
  title: z.string().min(1).max(200),
  expiresInDays: z.number().min(1).max(90).optional(),
  allowDownload: z.boolean().optional(),
})

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: z.infer<typeof CreateReviewSchema>
  try {
    body = CreateReviewSchema.parse(await req.json())
  } catch (e) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { projectId, title, expiresInDays, allowDownload = false } = body

  // Verify user owns the project
  const project = await db.project.findUnique({
    where: { id: projectId, userId },
    select: { id: true },
  })
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const expiresAt = expiresInDays
    ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)
    : null

  const reviewLink = await db.reviewLink.create({
    data: {
      projectId,
      userId,
      title,
      expiresAt,
      allowDownload,
    },
  })

  const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL}/review/${reviewLink.token}`

  return NextResponse.json({ reviewLink, reviewUrl })
}

export async function GET(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const projectId = searchParams.get('projectId')
  if (!projectId) return NextResponse.json({ error: 'projectId required' }, { status: 400 })

  const links = await db.reviewLink.findMany({
    where: { userId, projectId },
    include: {
      comments: { where: { resolved: false }, select: { id: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ links })
}
