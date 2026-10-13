jest.mock('nanoid', () => ({ nanoid: () => 'id' }))

import { recipeForTimeline } from '../lib/timeline/reconcileTimeline'
import type { TimelineRecipe } from '../lib/timeline/schema'

function recipe(tracks: TimelineRecipe['tracks']): TimelineRecipe {
  return {
    id: 'recipe',
    projectId: 'project',
    fps: 24,
    resolution: { width: 1920, height: 1080 },
    durationSeconds: 10,
    colorSpace: 'rec709',
    tracks,
  }
}

const rows = recipe([
  { id: 't-v1', type: 'video', label: 'VIDEO 1', muted: false, locked: false, solo: false, clips: [] },
])

describe('recipeForTimeline', () => {
  it('keeps the track rows when the stored recipe has no tracks', () => {
    const stored = recipe([])
    expect(recipeForTimeline(stored, rows)?.tracks).toHaveLength(1)
  })

  it('keeps the recipe that has more clips on the video track', () => {
    const withClip = recipe([
      { id: 't-v1', type: 'video', label: 'VIDEO 1', muted: false, locked: false, solo: false, clips: [
        { id: 'clip', trackId: 't-v1', startTime: 1, endTime: 4, sourceUrl: '/api/media/a/stream' },
      ] },
    ])
    expect(recipeForTimeline(rows, withClip)?.tracks[0]?.clips).toHaveLength(1)
  })
})
