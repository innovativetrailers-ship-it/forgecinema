import { db } from '@/lib/db'
import { appendJobProgressEvent } from '@/lib/jobs/jobProgressEvents'
import { ModelResolveError, resolveModel } from '@/lib/models/resolveModel'
import { traced } from '@/lib/obs/traced'
import { advanceChain } from '@/lib/studio/advanceChain'
import { getClipAnchorFrame, listShotPlan } from '@/lib/studio/shotPlan'
import { persistClipVideoToR2 } from '@/lib/storage/persistMedia'
import { isGenerationPaused } from '@/lib/generation/pause'
import { callVideoModel, extractTailFrame, getModelTimeout, withTimeout } from '@/lib/orchestration/bridgedGeneration'
import type { GenerationMode } from '@/lib/orchestration/costGuard'

export interface ProcessShotGenerateInput {
  jobId: string
  userId: string
  projectId: string
  clipId: string
  prompt?: string
  anchorFrameUrl?: string
  modelOverride?: string
  mode?: GenerationMode
}

export async function processShotGenerateJob(input: ProcessShotGenerateInput): Promise<void> {
  const { jobId, clipId, projectId, prompt: overridePrompt, anchorFrameUrl: inputAnchor, modelOverride } = input

  if (isGenerationPaused()) {
    const msg = 'Generation is paused (GENERATION_PAUSED). Set GENERATION_PAUSED=false to enable.'
    await appendJobProgressEvent(
      jobId,
      { phase: 'failed', status: 'failed', detail: msg },
      { status: 'FAILED', errorMessage: msg },
    )
    throw new Error(msg)
  }

  const clip = await traced(jobId, 'db_load_shot', 8_000, () =>
    db.studioClip.findUnique({
      where: { id: clipId },
      include: { scene: { select: { projectId: true, sceneNumber: true } } },
    }),
  )
  if (!clip || clip.scene.projectId !== projectId) {
    throw new Error(`Clip ${clipId} not found`)
  }

  if (clip.status === 'COMPLETED' && clip.videoUrl?.trim()) {
    console.log('[shot-generate] idempotent skip — already completed with videoUrl', { clipId, jobId })
    await appendJobProgressEvent(
      jobId,
      {
        phase: 'complete',
        status: 'completed',
        detail: JSON.stringify({ shotId: clipId, videoUrl: clip.videoUrl, idempotent: true }),
        pct: 100,
      },
      {
        status: 'COMPLETE',
        progressPct: 100,
        outputUrl: clip.videoUrl,
        completedAt: new Date(),
        statusMessage: 'Shot already complete',
      },
    )
    return
  }

  const mode =
    input.mode ??
    (modelOverride ?? clip.modelOverride ? 'production' : 'draft')

  const { shots } = await traced(jobId, 'shot_plan_read', 8_000, () => listShotPlan(projectId))
  const card = shots.find((s) => s.id === clipId)
  if (!card) throw new Error('Shot not in plan')

  const prompt = (overridePrompt ?? clip.prompt).trim()
  if (prompt.length < 3) throw new Error('Shot prompt is required')

  const rawModel = modelOverride ?? clip.modelOverride ?? clip.assignedModel
  if (!rawModel?.trim()) {
    const err = new ModelResolveError(
      'No model assigned for shot — pick a model before generating',
    )
    await db.studioClip.update({
      where: { id: clipId },
      data: { status: 'FAILED', generatingAt: null },
    }).catch(() => {})
    await appendJobProgressEvent(
      jobId,
      { phase: 'failed', status: 'failed', detail: err.message },
      { status: 'FAILED', errorMessage: err.message },
    )
    throw err
  }
  let assignedModel: string
  try {
    assignedModel = resolveModel(rawModel).canonicalId
  } catch (err) {
    if (err instanceof ModelResolveError) {
      await db.studioClip.update({
        where: { id: clipId },
        data: { status: 'FAILED', generatingAt: null },
      }).catch(() => {})
      await appendJobProgressEvent(
        jobId,
        { phase: 'failed', status: 'failed', detail: err.message },
        { status: 'FAILED', errorMessage: err.message },
      )
    }
    throw err
  }

  let crossSceneAnchor: string | undefined
  if (inputAnchor) {
    crossSceneAnchor = inputAnchor
  } else if (clip.anchorFrameUrl) {
    crossSceneAnchor = clip.anchorFrameUrl
  } else if (clip.anchorSource !== 'NONE') {
    crossSceneAnchor = await traced(jobId, 'anchor_prepare', 20_000, async () => {
      if (clip.anchorPolicy === 'previous-frame') {
        return getClipAnchorFrame(projectId, card.shotNumber)
      }
      if (clip.anchorPolicy === 'keyframe') {
        return clip.keyframeUrl ?? undefined
      }
      return undefined
    })
  }

  if (clip.status !== 'GENERATING') {
    await db.studioClip.update({
      where: { id: clipId },
      data: { status: 'GENERATING', prompt, generatingAt: new Date() },
    })
  }

  await traced(jobId, 'emit_progress', 5_000, () =>
    appendJobProgressEvent(
      jobId,
      { phase: `shot_${card.shotNumber}_start`, status: 'running', detail: `Generating shot ${card.shotNumber}…`, pct: 10 },
      { status: 'PROCESSING', progressPct: 10, phase: 'generating' },
    ),
  )

  try {
    const videoUrl = await traced(jobId, 'fal_submit', 30_000, () =>
      withTimeout(
        callVideoModel({
          model: assignedModel,
          prompt,
          duration: clip.duration,
          imageUrl: crossSceneAnchor,
          jobId,
          shotIndex: card.shotNumber - 1,
          generationMode: mode,
          onSubProgress: (s) => {
            void appendJobProgressEvent(
              jobId,
              { phase: 'generating', status: 'running', detail: s.message, pct: 10 + Math.round(s.pct * 0.8) },
              { progressPct: 10 + Math.round(s.pct * 0.8) },
            )
          },
        }),
        getModelTimeout(assignedModel),
        `Shot ${card.shotNumber}`,
      ),
    )

    if (!videoUrl?.trim()) {
      throw new Error(`shot ${clipId}: provider returned no videoUrl`)
    }

    const providerUrl = videoUrl
    let finalVideoUrl = providerUrl
    if (clip.lipSyncEnabled) {
      const dialogue = await db.audioTrack.findFirst({
        where: {
          projectId,
          shotPlanId: clipId,
          type: 'DIALOGUE',
          status: 'READY',
          muted: false,
          url: { not: null },
        },
      })
      if (dialogue?.url) {
        try {
          const { applyLipSyncToShot } = await import('@/lib/orchestration/lipSyncPass')
          finalVideoUrl = await applyLipSyncToShot(clipId, projectId, mode)
        } catch (lipErr) {
          console.warn('[shot-generate] lip sync failed:', lipErr instanceof Error ? lipErr.message : lipErr)
        }
      }
    }

    try {
      finalVideoUrl = await traced(jobId, 'mirror_r2', 120_000, () =>
        persistClipVideoToR2(finalVideoUrl, projectId, clipId),
      )
    } catch (mirrorErr) {
      console.warn('[shot-generate] R2 mirror failed — playback via /api/media proxy', {
        clipId,
        error: mirrorErr instanceof Error ? mirrorErr.message : String(mirrorErr),
      })
    }

    let lastFrame = ''
    try {
      lastFrame = (await extractTailFrame(finalVideoUrl)) ?? ''
    } catch (extractErr) {
      console.warn('[shot-generate] last_frame_extract_failed', {
        clipId,
        jobId,
        error: extractErr instanceof Error ? extractErr.message : String(extractErr),
      })
    }
    if (!lastFrame) {
      console.warn('[shot-generate] last_frame_extract_failed', {
        clipId,
        jobId,
        note: 'Next shot will advance without auto anchor — user can upload or generate one',
      })
    }

    await db.$transaction(async (tx) => {
      await tx.studioClip.update({
        where: { id: clipId },
        data: {
          status: 'COMPLETED',
          videoUrl: finalVideoUrl,
          rawVideoUrl: providerUrl !== finalVideoUrl ? providerUrl : null,
          lastFrame: lastFrame || null,
          manualVideo: false,
          generatingAt: null,
        },
      })
      await advanceChain(tx, projectId, clipId, lastFrame || null)
    })

    const detail = JSON.stringify({
      shotId: clipId,
      videoUrl: finalVideoUrl,
      lastFrame,
      durationSec: clip.duration,
      shotNumber: card.shotNumber,
    })

    await appendJobProgressEvent(
      jobId,
      { phase: `shot_${card.shotNumber}_complete`, status: 'completed', detail, pct: 100 },
      {
        status: 'COMPLETE',
        progressPct: 100,
        outputUrl: finalVideoUrl,
        completedAt: new Date(),
        statusMessage: `Shot ${card.shotNumber} complete`,
      },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    await db.studioClip.update({
      where: { id: clipId },
      data: { status: 'FAILED', generatingAt: null },
    }).catch(() => {})
    await appendJobProgressEvent(
      jobId,
      { phase: 'failed', status: 'failed', detail: msg },
      { status: 'FAILED', errorMessage: msg },
    )
    throw err
  }
}
