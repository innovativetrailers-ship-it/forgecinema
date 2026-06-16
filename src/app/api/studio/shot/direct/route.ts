import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { db } from '@/lib/db'
import { fastEstimateCost } from '@/lib/orchestration/fastEstimate'
import { checkAccess } from '@/lib/access/guard'
import { isGenerationPaused } from '@/lib/generation/pause'
import type { AnchorSource } from '@/generated/prisma/client'

const schema = z.object({
  shotPlanId: z.string(),
  projectId: z.string(),
  prompt: z.string().min(3),
  anchorFrameUrl: z.string().url().optional(),
  anchorSource: z.enum(['auto', 'manual', 'keyframe', 'none']).optional(),
  modelOverride: z.string().optional(),
  directionNotes: z.string().optional(),
  mode: z.enum(['draft', 'production']).default('draft'),
})

function toAnchorSource(source: 'auto' | 'manual' | 'keyframe' | 'none'): AnchorSource {
  switch (source) {
    case 'manual': return 'MANUAL'
    case 'keyframe': return 'KEYFRAME'
    case 'none': return 'NONE'
    default: return 'AUTO'
  }
}

function fromDbAnchorSource(source: AnchorSource): 'auto' | 'manual' | 'keyframe' | 'none' {
  switch (source) {
    case 'MANUAL': return 'manual'
    case 'KEYFRAME': return 'keyframe'
    case 'AUTO': return 'auto'
    default: return 'none'
  }
}

export async function POST(req: NextRequest) {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }
  const body = parsed.data

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

  let resolvedAnchor: string | null
  let resolvedSource: AnchorSource
  if (body.anchorSource === 'none') {
    resolvedAnchor = null
    resolvedSource = 'NONE'
  } else if (body.anchorFrameUrl) {
    resolvedAnchor = body.anchorFrameUrl
    resolvedSource = toAnchorSource(body.anchorSource ?? 'manual')
  } else {
    resolvedAnchor = clip.anchorFrameUrl
    resolvedSource = clip.anchorFrameUrl
      ? clip.anchorSource
      : 'NONE'
  }

  const effectiveModel = body.modelOverride ?? clip.modelOverride ?? clip.assignedModel ?? 'wan-2.6'
  const creditCost = Math.max(5, fastEstimateCost([effectiveModel], clip.duration))
  const access = await checkAccess(userId, creditCost, 'directorMode')
  if (!access.allowed) {
    return NextResponse.json({ error: access.reason ?? 'Access denied' }, { status: access.code ?? 402 })
  }

  const claimed = await db.$transaction(async (tx) => {
    const activeCount = await tx.studioClip.count({
      where: { scene: { projectId: body.projectId }, status: 'GENERATING' },
    })
    if (activeCount > 0) return 'busy' as const

    const r = await tx.studioClip.updateMany({
      where: {
        id: body.shotPlanId,
        status: { in: ['AWAITING_DIRECTION', 'PENDING', 'FAILED'] },
      },
      data: {
        prompt: body.prompt,
        anchorFrameUrl: resolvedAnchor,
        anchorSource: resolvedSource,
        modelOverride: body.modelOverride ?? clip.modelOverride ?? null,
        directionNotes: body.directionNotes ?? clip.directionNotes ?? null,
        assignedModel: effectiveModel,
        status: 'GENERATING',
        generatingAt: new Date(),
      },
    })
    return r.count === 1 ? 'ok' as const : 'invalid' as const
  })

  if (claimed === 'busy') {
    return NextResponse.json(
      { error: 'Another shot is currently generating — one shot at a time' },
      { status: 409 },
    )
  }
  if (claimed === 'invalid') {
    return NextResponse.json(
      { error: 'Shot is not directable (already generating or completed)' },
      { status: 409 },
    )
  }

  const job = await db.renderJob.create({
    data: {
      userId,
      projectId: body.projectId,
      type: 'GENERATE',
      status: 'QUEUED',
      mode: 'director',
      prompt: body.prompt,
      duration: clip.duration,
      creditsCharged: creditCost,
      metadata: {
        type: 'SHOT_GENERATE',
        clipId: clip.id,
        mode: body.mode,
        anchorFrameUrl: resolvedAnchor ?? undefined,
        anchorSource: fromDbAnchorSource(resolvedSource),
        effectiveModel,
        source: 'user_directed',
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
      prompt: body.prompt,
      anchorFrameUrl: resolvedAnchor ?? undefined,
      modelOverride: body.modelOverride,
      mode: body.mode,
      source: 'user_directed',
    }, { attempts: 2 })
  } catch {
    await db.studioClip.update({
      where: { id: body.shotPlanId },
      data: { status: 'AWAITING_DIRECTION', generatingAt: null },
    })
    await db.renderJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', errorMessage: 'Queue unavailable' },
    })

    if (process.env.VERCEL) {
      const { processShotGenerateJob } = await import('@/lib/jobs/processShotGenerateJob')
      void processShotGenerateJob({
        jobId: job.id,
        userId,
        projectId: body.projectId,
        clipId: clip.id,
        prompt: body.prompt,
        anchorFrameUrl: resolvedAnchor ?? undefined,
        modelOverride: body.modelOverride,
        mode: body.mode,
      }).catch((err) => console.error('[shot-direct] inline failed:', err))
    } else {
      return NextResponse.json({ error: 'Queue unavailable — try again' }, { status: 503 })
    }
  }

  return NextResponse.json({
    jobId: job.id,
    anchorUsed: resolvedAnchor,
    model: effectiveModel,
  })
}
