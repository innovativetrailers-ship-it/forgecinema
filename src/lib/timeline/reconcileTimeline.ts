import { nanoid } from 'nanoid'
import { jobPlaybackPath } from '@/lib/media/jobPlayback'
import type { ShotPlanCard } from '@/lib/studio/shotPlan'
import type { Clip, TimelineRecipe } from '@/lib/timeline/schema'
import { computeTimelineDuration, sanitizeClipDuration } from '@/lib/timeline/playback'
import { useTimelineStore } from '@/store/timeline'

const VIDEO_TRACK_ID = 't-v1'

function isCompletedShot(shot: ShotPlanCard): boolean {
  return (shot.status === 'completed' || shot.status === 'manual') && Boolean(shot.videoUrl?.trim())
}

/** Self-heal simple-mode timeline from DB completed shots. */
export function reconcileTimelineStore(shots: ShotPlanCard[]): void {
  const existing = new Set(useTimelineStore.getState().clips.map((c) => c.id))
  const ordered = [...shots].sort((a, b) => a.shotNumber - b.shotNumber)

  for (const shot of ordered) {
    if (!isCompletedShot(shot) || existing.has(shot.id)) continue
    useTimelineStore.getState().addClip({
      id: shot.id,
      sourceUrl: shot.videoUrl!,
      posterUrl: shot.lastFrame,
      durationSec: sanitizeClipDuration(shot.duration, 5),
      track: 'video',
      label: `Shot ${shot.shotNumber}`,
    })
  }
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

/** Add missing shot-plan clips to the Ultimate editor recipe. */
export function reconcileRecipeFromShots(
  shots: ShotPlanCard[],
  recipe: TimelineRecipe,
): TimelineRecipe {
  const existing = shotIdsOnRecipe(recipe)
  const track = recipe.tracks.find((t) => t.id === VIDEO_TRACK_ID)
  let lastEnd = track?.clips.reduce((max, c) => Math.max(max, c.endTime), 0) ?? 0
  const newClips: Clip[] = []

  for (const shot of [...shots].sort((a, b) => a.shotNumber - b.shotNumber)) {
    if (!isCompletedShot(shot) || existing.has(shot.id)) continue

    const dur = sanitizeClipDuration(shot.duration, 5)
    const clipId = nanoid()
    newClips.push({
      id: clipId,
      trackId: VIDEO_TRACK_ID,
      startTime: lastEnd,
      endTime: lastEnd + dur,
      sourceUrl: shot.videoUrl!,
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
