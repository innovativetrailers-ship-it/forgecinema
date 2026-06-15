import { nanoid } from 'nanoid'
import { jobPlaybackPath } from '@/lib/media/jobPlayback'
import type { ShotPlanCard } from '@/lib/studio/shotPlan'
import type { Clip, TimelineRecipe } from '@/lib/timeline/schema'
import { computeTimelineDuration, sanitizeClipDuration } from '@/lib/timeline/playback'
import { useTimelineStore, type TimelineClip } from '@/store/timeline'

const VIDEO_TRACK_ID = 't-v1'

function isTimelineShot(shot: ShotPlanCard): boolean {
  return shot.status === 'completed' || shot.status === 'manual'
}

function shotIdsOnRecipe(recipe: TimelineRecipe): Set<string> {
  const track = recipe.tracks.find((t) => t.id === VIDEO_TRACK_ID)
  const ids = new Set<string>()
  for (const clip of track?.clips ?? []) {
    const meta = clip.metadata as { shotPlanId?: string } | undefined
    if (meta?.shotPlanId) ids.add(meta.shotPlanId)
  }
  return ids
}

function logReconcileDiagnostics(
  shots: ShotPlanCard[],
  added: number,
): void {
  const completed = shots.filter(isTimelineShot).length
  const withVideo = shots.filter((s) => Boolean(s.videoUrl?.trim())).length
  console.log('reconcileTimeline', {
    total: shots.length,
    completed,
    withVideo,
    added,
  })
}

/** Mirror completed shots into the shared simple-mode timeline store (no playback double-write). */
export function syncTimelineStoreFromShots(shots: ShotPlanCard[]): void {
  const ordered = [...shots].sort((a, b) => a.shotNumber - b.shotNumber)
  let startSec = 0
  const clips: TimelineClip[] = []

  for (const shot of ordered) {
    if (!isTimelineShot(shot)) continue
    const dur = sanitizeClipDuration(shot.duration, 5)
    clips.push({
      id: shot.id,
      sourceUrl: shot.videoUrl?.trim() ?? '',
      posterUrl: shot.lastFrame,
      startSec,
      durationSec: dur,
      track: 'video',
      label: `Shot ${shot.shotNumber}`,
    })
    startSec += dur
  }

  useTimelineStore.setState({ clips, playheadSec: 0, isPlaying: false })
}

/** @deprecated Use reconcileTimeline — kept for imports that only need the store projection. */
export function reconcileTimelineStore(shots: ShotPlanCard[]): void {
  syncTimelineStoreFromShots(shots)
}

/** Add missing shot-plan clips to the Ultimate/Advanced editor recipe. */
export function reconcileRecipeFromShots(
  shots: ShotPlanCard[],
  recipe: TimelineRecipe,
): TimelineRecipe {
  const existing = shotIdsOnRecipe(recipe)
  const track = recipe.tracks.find((t) => t.id === VIDEO_TRACK_ID)
  let lastEnd = track?.clips.reduce((max, c) => Math.max(max, c.endTime), 0) ?? 0
  const newClips: Clip[] = []

  for (const shot of [...shots].sort((a, b) => a.shotNumber - b.shotNumber)) {
    if (!isTimelineShot(shot) || existing.has(shot.id)) continue

    const dur = sanitizeClipDuration(shot.duration, 5)
    const clipId = nanoid()
    newClips.push({
      id: clipId,
      trackId: VIDEO_TRACK_ID,
      startTime: lastEnd,
      endTime: lastEnd + dur,
      sourceUrl: shot.videoUrl?.trim() ?? '',
      posterUrl: shot.lastFrame,
      prompt: `Shot ${shot.shotNumber}`,
      metadata: { shotPlanId: shot.id },
    })
    lastEnd += dur
    existing.add(shot.id)
  }

  if (newClips.length === 0) return recipe

  const nextTracks = recipe.tracks.map((t) =>
    t.id === VIDEO_TRACK_ID ? { ...t, clips: [...t.clips, ...newClips] } : t,
  )

  return {
    ...recipe,
    tracks: nextTracks,
    durationSeconds: computeTimelineDuration(nextTracks, recipe.durationSeconds),
  }
}

/** Unified projection: DB completed shots → editor recipe + shared timeline store. */
export function reconcileTimeline(
  shots: ShotPlanCard[],
  recipe: TimelineRecipe,
): { recipe: TimelineRecipe; added: number } {
  const before = shotIdsOnRecipe(recipe).size
  const next = reconcileRecipeFromShots(shots, recipe)
  syncTimelineStoreFromShots(shots)
  const added = shotIdsOnRecipe(next).size - before
  logReconcileDiagnostics(shots, added)
  return { recipe: next, added }
}

/** Prefer same-origin playback when a render job id is known. */
export function reconcileRecipeFromShotsWithJobs(
  shots: ShotPlanCard[],
  recipe: TimelineRecipe,
  jobIdByShotId?: Map<string, string>,
): TimelineRecipe {
  if (!jobIdByShotId?.size) return reconcileRecipeFromShots(shots, recipe)

  const patched = shots.map((s) => {
    const jobId = jobIdByShotId.get(s.id)
    const playback = jobId ? jobPlaybackPath(jobId) : null
    return playback && s.videoUrl ? { ...s, videoUrl: playback } : s
  })
  return reconcileRecipeFromShots(patched, recipe)
}
