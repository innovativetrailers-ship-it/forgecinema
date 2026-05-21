import type { TimelineRecipe as SchemaRecipe, Track as SchemaTrack, Clip as SchemaClip } from '@/lib/timeline/schema'
import type { TimelineRecipe as EditorRecipe, Track as EditorTrack, Clip as EditorClip } from '@/store/editor'

const mapTrackType = (type: SchemaTrack['type']): EditorTrack['type'] => {
  if (type === 'caption') return 'text'
  if (type === 'cgi' || type === 'vfx' || type === 'audio' || type === 'video') return type
  return 'video'
}

const toEditorClip = (clip: SchemaClip, trackType: EditorTrack['type']): EditorClip => {
  const duration = Math.max(0, clip.endTime - clip.startTime)
  return {
    id: clip.id,
    trackId: clip.trackId,
    startTime: clip.startTime,
    duration,
    videoUrl: clip.sourceUrl || null,
    proxyUrl: clip.proxyUrl ?? null,
    thumbnailUrl: null,
    prompt: clip.prompt ?? '',
    engineUsed: clip.modelUsed ?? 'imported',
    tier: 'Draft',
    characterIds: clip.characterId ? [clip.characterId] : [],
    locationId: clip.locationId ?? null,
    isGenerating: false,
    generationProgress: 0,
    jobId: null,
    trimIn: 0,
    trimOut: duration,
    volume: 1,
    opacity: 1,
    speed: 1,
    colourGradeJson: clip.colourGrade ?? null,
    sfxMakeupJson: null,
    name: clip.prompt,
    src: clip.sourceUrl,
    type: trackType,
    metadata: clip.metadata,
  }
}

const toEditorTrack = (track: SchemaTrack): EditorTrack => {
  const type = mapTrackType(track.type)
  return {
    id: track.id,
    type,
    name: track.label,
    label: track.label,
    height: type === 'audio' ? 48 : 72,
    muted: track.muted,
    locked: track.locked,
    solo: track.solo,
    volume: track.volume,
    clips: track.clips.map((c) => toEditorClip(c, type)),
  }
}

export const toEditorTimelineRecipe = (recipe: SchemaRecipe): EditorRecipe => ({
  id: recipe.id,
  projectId: recipe.projectId,
  tracks: recipe.tracks.map(toEditorTrack),
  totalDuration: recipe.durationSeconds,
  durationSeconds: recipe.durationSeconds,
  fps: recipe.fps,
  resolution: recipe.resolution,
  colourSpace: recipe.colorSpace,
})
