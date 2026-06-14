/**
 * Layer 3 — segment checkpoints for resume-without-repay.
 */

import { db } from '@/lib/db'
import {
  parseFalSubmission,
  serializeFalSubmission,
  type FalSubmission,
} from '@/lib/fal/falQueue'

const FAL_SUBMISSION_MARKER = '__fal_submission__'

export interface SegmentCheckpointRow {
  segmentId: string
  shotId: number
  videoUrl: string
  modelUsed: string
  cost: number
  qaPassed: boolean
  anchorFrame?: string | null
}

export async function loadCheckpoint(
  jobId: string,
  segmentId: string,
): Promise<SegmentCheckpointRow | null> {
  const row = await db.segmentCheckpoint.findUnique({
    where: { jobId_segmentId: { jobId, segmentId } },
  })
  if (!row) return null
  return {
    segmentId: row.segmentId,
    shotId: row.shotId,
    videoUrl: row.videoUrl,
    modelUsed: row.modelUsed,
    cost: row.cost,
    qaPassed: row.qaPassed,
    anchorFrame: row.anchorFrame,
  }
}

export async function saveCheckpoint(input: {
  jobId: string
  segmentId: string
  shotId: number
  videoUrl: string
  modelUsed: string
  cost: number
  qaPassed?: boolean
  anchorFrame?: string
}): Promise<void> {
  await db.segmentCheckpoint.upsert({
    where: { jobId_segmentId: { jobId: input.jobId, segmentId: input.segmentId } },
    create: {
      jobId: input.jobId,
      segmentId: input.segmentId,
      shotId: input.shotId,
      videoUrl: input.videoUrl,
      modelUsed: input.modelUsed,
      cost: input.cost,
      qaPassed: input.qaPassed ?? true,
      anchorFrame: input.anchorFrame,
    },
    update: {
      videoUrl: input.videoUrl,
      modelUsed: input.modelUsed,
      cost: input.cost,
      qaPassed: input.qaPassed ?? true,
      anchorFrame: input.anchorFrame,
    },
  })
}

export async function loadKeyframeCheckpoint(
  jobId: string,
  shotIndex: number,
): Promise<string | null> {
  const row = await loadCheckpoint(jobId, `keyframe_${shotIndex}`)
  return row?.videoUrl ?? null
}

export async function saveKeyframeCheckpoint(
  jobId: string,
  shotIndex: number,
  url: string,
): Promise<void> {
  await saveCheckpoint({
    jobId,
    segmentId: `keyframe_${shotIndex}`,
    shotId: shotIndex,
    videoUrl: url,
    modelUsed: 'keyframe',
    cost: 0,
    qaPassed: true,
  })
}

export async function loadSubmissionCheckpoint(
  jobId: string,
  segmentId: string,
): Promise<FalSubmission | null> {
  const row = await loadCheckpoint(jobId, `submission_${segmentId}`)
  if (!row || row.modelUsed !== FAL_SUBMISSION_MARKER) return null
  return parseFalSubmission(row.videoUrl)
}

export async function saveSubmissionCheckpoint(
  jobId: string,
  segmentId: string,
  shotId: number,
  submission: FalSubmission,
): Promise<void> {
  await saveCheckpoint({
    jobId,
    segmentId: `submission_${segmentId}`,
    shotId,
    videoUrl: serializeFalSubmission(submission),
    modelUsed: FAL_SUBMISSION_MARKER,
    cost: 0,
    qaPassed: false,
  })
}

export async function clearSubmissionCheckpoint(
  jobId: string,
  segmentId: string,
): Promise<void> {
  await db.segmentCheckpoint.delete({
    where: { jobId_segmentId: { jobId, segmentId: `submission_${segmentId}` } },
  }).catch(() => {})
}

const DECOMPOSITION_SEGMENT_ID = 'decomposition'
const DECOMPOSITION_MARKER = '__decomposition__'

export async function saveDecompositionCheckpoint(
  jobId: string,
  shots: unknown[],
): Promise<void> {
  await saveCheckpoint({
    jobId,
    segmentId: DECOMPOSITION_SEGMENT_ID,
    shotId: -1,
    videoUrl: JSON.stringify(shots),
    modelUsed: DECOMPOSITION_MARKER,
    cost: 0,
    qaPassed: true,
  })
}

export async function clearDecompositionCheckpoint(jobId: string): Promise<void> {
  await db.segmentCheckpoint.delete({
    where: { jobId_segmentId: { jobId, segmentId: DECOMPOSITION_SEGMENT_ID } },
  }).catch(() => {})
}

export async function listCheckpoints(jobId: string): Promise<SegmentCheckpointRow[]> {
  const rows = await db.segmentCheckpoint.findMany({ where: { jobId } })
  return rows.map((row) => ({
    segmentId: row.segmentId,
    shotId: row.shotId,
    videoUrl: row.videoUrl,
    modelUsed: row.modelUsed,
    cost: row.cost,
    qaPassed: row.qaPassed,
    anchorFrame: row.anchorFrame,
  }))
}
