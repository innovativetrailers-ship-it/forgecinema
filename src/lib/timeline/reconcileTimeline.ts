import { nanoid } from 'nanoid'
import { jobPlaybackPath } from '@/lib/media/jobPlayback'
import { shotPlaybackUrl } from '@/lib/media/clipPlayback'
import type { ShotPlanCard } from '@/lib/studio/shotPlan'
import type { Clip, TimelineRecipe, Track } from '@/lib/timeline/schema'
import { computeTimelineDuration, isVideoMediaUrl, sanitizeClipDuration } from '@/lib/timeline/playback'
import { useTimelineStore, type TimelineClip } from '@/store/timeline'

const VIDEO_TRACK_ID = 't-v1'

function isTimelineShot(shot: ShotPlanCard): boolean {
  return shot.status === 'completed' || shot.status === 'manual'
}

function findClipForShot(track: Track, shotId: string): Clip | undefined {
  return track.clips.find((c) => {
    const meta = c.metadata as { shotPlanId?: string } | undefined
    return meta?.shotPlanId === shotId || c.id === shotId
  })
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

function hasPlayableSource(clip: Clip): boolean {
  return Boolean(clip.sourceUrl?.trim()) && isVideoMediaUrl(clip.sourceUrl)
}

function logReconcileDiagnostics(
  shots: ShotPlanCard[],
  added: number,
  updated: number,
): void {
  const completed = shots.filter(isTimelineShot).length
  const withVideo = shots.filter((s) => Boolean(s.videoUrl?.trim())).length
  console.log('reconcileTimeline', {
    total: shots.length,
    completed,
    withVideo,
    added,
    updated,
  })
}

function playbackForShot(shot: ShotPlanCard): string {
  return shotPlaybackUrl(shot.id, shot.videoUrl)
}

/** Mirror completed shots into the shared simple-mode timeline store. */
export function syncTimelineStoreFromShots(shots: ShotPlanCard[]): { added: number; updated: number } {
  const store = useTimelineStore.getState()
  const existing = new Map(store.clips.map((c) => [c.id, c]))
  const ordered = [...shots].sort((a, b) => a.shotNumber - b.shotNumber)
  let startSec = 0
  const nextClips: TimelineClip[] = []
  let added = 0
  let updated = 0

  for (const shot of ordered) {
    if (!isTimelineShot(shot)) continue

    const sourceUrl = playbackForShot(shot)
    console.log('addClip input', { id: shot.id, sourceUrl, hasUrl: Boolean(sourceUrl) })

    const dur = sanitizeClipDuration(shot.duration, 5)
    const prior = existing.get(shot.id)

    if (prior?.sourceUrl?.trim() && isVideoMediaUrl(prior.sourceUrl)) {
      nextClips.push({ ...prior, startSec, durationSec: dur })
      startSec += dur
      continue
    }

    if (prior && !prior.sourceUrl?.trim() && sourceUrl) {
      nextClips.push({
        ...prior,
        sourceUrl,
        posterUrl: shot.lastFrame ?? prior.posterUrl,
        startSec,
        durationSec: dur,
      })
      updated++
    } else if (!prior) {
      nextClips.push({
        id: shot.id,
        sourceUrl,
        posterUrl: shot.lastFrame,
        startSec,
        durationSec: dur,
        track: 'video',
        label: `Shot ${shot.shotNumber}`,
      })
      if (sourceUrl) added++
    } else {
      nextClips.push({
        id: shot.id,
        sourceUrl,
        posterUrl: shot.lastFrame,
        startSec,
        durationSec: dur,
        track: 'video',
        label: `Shot ${shot.shotNumber}`,
      })
    }
    startSec += dur
  }

  useTimelineStore.setState({ clips: nextClips, playheadSec: 0, isPlaying: false })
  return { added, updated }
}

/** @deprecated Use reconcileTimeline — kept for imports that only need the store projection. */
export function reconcileTimelineStore(shots: ShotPlanCard[]): void {
  syncTimelineStoreFromShots(shots)
}

/** Add or fill shot-plan clips on the Ultimate/Advanced editor recipe. */
export function reconcileRecipeFromShots(
  shots: ShotPlanCard[],
  recipe: TimelineRecipe,
): { recipe: TimelineRecipe; added: number; updated: number } {
  const track = recipe.tracks.find((t) => t.id === VIDEO_TRACK_ID)
  if (!track) return { recipe, added: 0, updated: 0 }

  let clips = [...track.clips]
  let lastEnd = clips.reduce((max, c) => Math.max(max, c.endTime), 0)
  let added = 0
  let updated = 0
  let changed = false

  for (const shot of [...shots].sort((a, b) => a.shotNumber - b.shotNumber)) {
    if (!isTimelineShot(shot)) continue

    const sourceUrl = playbackForShot(shot)
    const dur = sanitizeClipDuration(shot.duration, 5)
    const prior = findClipForShot({ ...track, clips }, shot.id)
    const priorIdx = prior ? clips.findIndex((c) => c.id === prior.id) : -1

    if (prior && hasPlayableSource(prior) && (!sourceUrl || prior.sourceUrl === sourceUrl)) {
      continue
    }

    if (priorIdx >= 0) {
      const shell = clips[priorIdx]
      clips = clips.map((c, i) =>
        i === priorIdx
          ? {
              ...shell,
              sourceUrl: sourceUrl || shell.sourceUrl,
              posterUrl: shot.lastFrame ?? shell.posterUrl,
            }
          : c,
      )
      if (sourceUrl && !shell.sourceUrl?.trim()) updated++
      else if (sourceUrl && shell.sourceUrl !== sourceUrl) updated++
      changed = true
      continue
    }

    const clipId = nanoid()
    clips.push({
      id: clipId,
      trackId: VIDEO_TRACK_ID,
      startTime: lastEnd,
      endTime: lastEnd + dur,
      sourceUrl,
      posterUrl: shot.lastFrame,
      prompt: `Shot ${shot.shotNumber}`,
      metadata: { shotPlanId: shot.id },
    })
    lastEnd += dur
    added++
    changed = true
  }

  if (!changed) return { recipe, added: 0, updated: 0 }

  const nextTracks = recipe.tracks.map((t) =>
    t.id === VIDEO_TRACK_ID ? { ...t, clips } : t,
  )

  return {
    recipe: {
      ...recipe,
      tracks: nextTracks,
      durationSeconds: computeTimelineDuration(nextTracks, recipe.durationSeconds),
    },
    added,
    updated,
  }
}

/** Unified projection: DB completed shots → editor recipe + shared timeline store. */
export function reconcileTimeline(
  shots: ShotPlanCard[],
  recipe: TimelineRecipe,
): { recipe: TimelineRecipe; added: number; updated: number } {
  const before = shotIdsOnRecipe(recipe).size
  const { recipe: next, added, updated } = reconcileRecipeFromShots(shots, recipe)
  const storeStats = syncTimelineStoreFromShots(shots)
  const after = shotIdsOnRecipe(next).size
  const recipeAdded = Math.max(0, after - before)
  logReconcileDiagnostics(shots, recipeAdded || added, updated || storeStats.updated)
  return { recipe: next, added: recipeAdded || added, updated: updated || storeStats.updated }
}

/** Prefer same-origin playback when a render job id is known. */
export function reconcileRecipeFromShotsWithJobs(
  shots: ShotPlanCard[],
  recipe: TimelineRecipe,
  jobIdByShotId?: Map<string, string>,
): TimelineRecipe {
  if (!jobIdByShotId?.size) return reconcileRecipeFromShots(shots, recipe).recipe

  const patched = shots.map((s) => {
    const jobId = jobIdByShotId.get(s.id)
    const playback = jobId ? jobPlaybackPath(jobId) : null
    return playback && s.videoUrl ? { ...s, videoUrl: playback } : s
  })
  return reconcileRecipeFromShots(patched, recipe).recipe
}
