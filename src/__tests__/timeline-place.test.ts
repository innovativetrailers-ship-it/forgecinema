jest.mock('nanoid', () => ({ nanoid: () => 'id' }))

import { appendTimelineClipToPlayback } from '../lib/timeline/syncToPlayback'
import { usePlaybackStore } from '../store/playbackStore'

describe('library drop keeps the requested start', () => {
  beforeEach(() => {
    usePlaybackStore.setState({
      recipe: {
        id: 'recipe',
        projectId: 'project',
        fps: 24,
        resolution: { width: 1920, height: 1080 },
        durationSeconds: 10,
        colorSpace: 'rec709',
        tracks: [
          { id: 't-v1', type: 'video', label: 'VIDEO 1', muted: false, locked: false, solo: false, clips: [
            { id: 'existing', trackId: 't-v1', startTime: 0, endTime: 5, sourceUrl: '/api/media/old/stream' },
          ] },
        ],
      },
    })
  })

  it('does not move a drop at 2s onto the clip that starts at 0', () => {
    appendTimelineClipToPlayback({
      id: 'place_new_2',
      sourceUrl: '/api/media/new',
      durationSec: 5,
      track: 'video',
      label: 'Take',
      mediaId: 'new',
      startSec: 2,
    })
    const clips = usePlaybackStore.getState().recipe?.tracks[0]?.clips ?? []
    const placed = clips.find((clip) => clip.id === 'place_new_2')
    expect(placed?.startTime).toBe(2)
    expect(clips.find((clip) => clip.id === 'existing')?.startTime).toBe(0)
  })
})
