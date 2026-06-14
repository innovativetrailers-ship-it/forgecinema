import { nanoid } from 'nanoid'
import type { Clip, TimelineRecipe, Track } from '@/lib/timeline/schema'
import { computeTimelineDuration } from '@/lib/timeline/playback'
import { usePlaybackStore } from '@/store/playbackStore'
import type { TimelineClip } from '@/store/timeline'

const VIDEO_TRACK_ID = 't-v1'

function defaultTracks(clips: Clip[]): Track[] {
  return [
    { id: 't-v1', type: 'video', label: 'VIDEO 1', muted: false, locked: false, solo: false, clips },
    { id: 't-v2', type: 'video', label: 'VIDEO 2', muted: false, locked: false, solo: false, clips: [] },
    { id: 't-vfx', type: 'vfx', label: 'VFX', muted: false, locked: false, solo: false, clips: [] },
    { id: 't-cgi', type: 'cgi', label: 'CGI', muted: false, locked: false, solo: false, clips: [] },
    { id: 't-music', type: 'audio', label: 'MUSIC', muted: false, locked: false, solo: false, volume: 0.7, clips: [] },
    { id: 't-voice', type: 'audio', label: 'VOICE', muted: false, locked: false, solo: false, volume: 1, clips: [] },
    { id: 't-sfx', type: 'audio', label: 'SFX', muted: false, locked: false, solo: false, volume: 0.6, clips: [] },
    { id: 't-cap', type: 'caption', label: 'CAPTIONS', muted: false, locked: false, solo: false, clips: [] },
  ]
}

export function timelineClipToRecipeClip(timelineClip: TimelineClip): Clip {
  return {
    id: timelineClip.id,
    trackId: VIDEO_TRACK_ID,
    startTime: timelineClip.startSec,
    endTime: timelineClip.startSec + timelineClip.durationSec,
    sourceUrl: timelineClip.sourceUrl,
    posterUrl: timelineClip.posterUrl,
    prompt: timelineClip.label,
  }
}

export function appendTimelineClipToPlayback(timelineClip: TimelineClip): void {
  const recipeClip = timelineClipToRecipeClip(timelineClip)
  const { recipe, setRecipe, projectId } = usePlaybackStore.getState()

  if (!recipe) {
    const tracks = defaultTracks([recipeClip])
    setRecipe({
      id: nanoid(),
      projectId: projectId ?? nanoid(),
      fps: 24,
      resolution: { width: 1920, height: 1080 },
      durationSeconds: computeTimelineDuration(tracks, 10),
      colorSpace: 'rec709',
      tracks,
    })
    return
  }

  const tracks = recipe.tracks.map((track) => {
    if (track.id !== VIDEO_TRACK_ID) return track
    const without = track.clips.filter((c) => c.id !== recipeClip.id)
    return { ...track, clips: [...without, recipeClip].sort((a, b) => a.startTime - b.startTime) }
  })

  const next: TimelineRecipe = {
    ...recipe,
    tracks,
    durationSeconds: computeTimelineDuration(tracks, recipe.durationSeconds),
  }
  setRecipe(next)
}
