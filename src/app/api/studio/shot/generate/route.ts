import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { fastEstimateCost } from '@/lib/orchestration/fastEstimate'
import { checkAccess } from '@/lib/access/guard'
import { isGenerationPaused } from '@/lib/generation/pause'

const schema = z.object({
  shotPlanId: z.string(),
  projectId: z.string(),
  mode: z.enum(['draft', 'production']).default('draft'),
  overridePrompt: z.string().optional(),
})

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = schema.parse(await req.json())

  if (isGenerationPaused()) {
    return NextResponse.json(
      { error: 'Generation is paused for maintenance. Set GENERATION_PAUSED=false to enable.' },
      { status: 503 },
    )
  }

  const clip = await db.studioClip.findUnique({
    where: { id: body.shotPlanId },
    include: { scene: { include: { project: { select: { userId: true, id: true } } } } },
  })
  if (!clip || clip.scene.projectId !== body.projectId || clip.scene.project.userId !== userId) {
    return NextResponse.json({ error: 'Shot not found' }, { status: 404 })
  }

  const creditCost = Math.max(5, fastEstimateCost([clip.assignedModel ?? 'wan-2.6'], clip.duration))
  const access = await checkAccess(userId, creditCost, 'directorMode')
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason ?? 'Access denied' }, { status: access.code ?? 402 })
  }

  const job = await db.renderJob.create({
    data: {
      userId,
      projectId: body.projectId,
      type: 'GENERATE',
      status: 'QUEUED',
      mode: 'director',
      prompt: body.overridePrompt ?? clip.prompt,
      duration: clip.duration,
      creditsCharged: creditCost,
      metadata: {
        type: 'SHOT_GENERATE',
        clipId: clip.id,
        mode: body.mode,
        overridePrompt: body.overridePrompt,
      },
    },
  })

  try {
    const { renderQueue } = await import('@/lib/queue')
    await renderQueue.add('shot-generate', {
      jobId: job.id,
      userId,
      projectId: body.projectId,
      clipId: clip.id,
      prompt: body.overridePrompt,
      mode: body.mode,
    }, { attempts: 2 })
  } catch {
    if (process.env.VERCEL) {
      const { processShotGenerateJob } = await import('@/lib/jobs/processShotGenerateJob')
      void processShotGenerateJob({
        jobId: job.id,
        userId,
        projectId: body.projectId,
        clipId: clip.id,
        prompt: body.overridePrompt,
        mode: body.mode,
      }).catch((err) => console.error('[shot-generate] inline failed:', err))
    } else {
      return NextResponse.json({ error: 'Render queue unavailable' }, { status: 503 })
    }
  }

  return NextResponse.json({ jobId: job.id })
}
