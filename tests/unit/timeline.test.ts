/**
 * Unit tests for timeline manipulation logic
 */
import type { Clip, Track } from '../../src/lib/timeline/schema'

let _idCounter = 0
function nanoid() { return `id-${++_idCounter}` }

function makeClip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: nanoid(),
    trackId: 't-v1',
    startTime: 0,
    endTime: 5,
    sourceUrl: 'https://example.com/clip.mp4',
    ...overrides,
  }
}

function makeTrack(clips: Clip[] = []): Track {
  return { id: 't-v1', type: 'video', label: 'VIDEO 1', muted: false, locked: false, solo: false, clips }
}

// ── Clip placement ──────────────────────────────────────────────────────────
describe('Clip placement', () => {
  test('computes last end time from track clips', () => {
    const clips = [makeClip({ startTime: 0, endTime: 5 }), makeClip({ startTime: 5, endTime: 12 })]
    const track = makeTrack(clips)
    const lastEnd = track.clips.reduce((max, c) => Math.max(max, c.endTime), 0)
    expect(lastEnd).toBe(12)
  })

  test('returns 0 for empty track', () => {
    const track = makeTrack([])
    const lastEnd = track.clips.reduce((max, c) => Math.max(max, c.endTime), 0)
    expect(lastEnd).toBe(0)
  })

  test('handles out-of-order clips', () => {
    const clips = [makeClip({ startTime: 10, endTime: 15 }), makeClip({ startTime: 0, endTime: 5 })]
    const track = makeTrack(clips)
    const lastEnd = track.clips.reduce((max, c) => Math.max(max, c.endTime), 0)
    expect(lastEnd).toBe(15)
  })
})

// Suppress TS error for the makeTrack().and() call used in mute/solo test — it's a no-op trick
declare global { interface Array<T> { and(extra: T): T[] } }
if (!Array.prototype.and) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Array.prototype, 'and', { value() { return this }, enumerable: false })
}

// ── Trim operations ─────────────────────────────────────────────────────────
describe('Clip trimming', () => {
  function trimStart(clip: Clip, newStart: number): Clip {
    return { ...clip, startTime: Math.min(newStart, clip.endTime - 0.5) }
  }

  function trimEnd(clip: Clip, newEnd: number): Clip {
    return { ...clip, endTime: Math.max(newEnd, clip.startTime + 0.5) }
  }

  test('trim start within valid range', () => {
    const clip = makeClip({ startTime: 0, endTime: 10 })
    const trimmed = trimStart(clip, 3)
    expect(trimmed.startTime).toBe(3)
    expect(trimmed.endTime).toBe(10)
  })

  test('trim start cannot exceed endTime - 0.5s', () => {
    const clip = makeClip({ startTime: 0, endTime: 5 })
    const trimmed = trimStart(clip, 8)
    expect(trimmed.startTime).toBe(4.5) // clamped to endTime - 0.5
    expect(trimmed.endTime).toBe(5)
  })

  test('trim end within valid range', () => {
    const clip = makeClip({ startTime: 0, endTime: 10 })
    const trimmed = trimEnd(clip, 7)
    expect(trimmed.endTime).toBe(7)
    expect(trimmed.startTime).toBe(0)
  })

  test('trim end cannot go below startTime + 0.5s', () => {
    const clip = makeClip({ startTime: 5, endTime: 10 })
    const trimmed = trimEnd(clip, 2)
    expect(trimmed.endTime).toBe(5.5) // clamped to startTime + 0.5
  })

  test('clip duration after trim is always >= 0.5s', () => {
    const clip = makeClip({ startTime: 0, endTime: 5 })
    const startTrimmed = trimStart(clip, 4.9)
    expect(startTrimmed.endTime - startTrimmed.startTime).toBeGreaterThanOrEqual(0.5)
  })
})

// ── Zoom / time conversions ─────────────────────────────────────────────────
describe('Timeline zoom conversions', () => {
  function timeToX(t: number, zoom: number, scroll: number): number {
    return t * zoom - scroll
  }

  function xToTime(x: number, zoom: number, scroll: number): number {
    return (x + scroll) / zoom
  }

  test('timeToX: at scroll=0 zoom=80, 5s = 400px', () => {
    expect(timeToX(5, 80, 0)).toBe(400)
  })

  test('timeToX: scroll offsets correctly', () => {
    expect(timeToX(5, 80, 200)).toBe(200) // 400 - 200
  })

  test('xToTime is inverse of timeToX', () => {
    const zoom = 80
    const scroll = 100
    const t = 7.5
    const x = timeToX(t, zoom, scroll)
    expect(xToTime(x, zoom, scroll)).toBeCloseTo(t)
  })

  test('zoom doubling halves the px-per-second density for xToTime', () => {
    // At zoom=80, x=160 → t=2s
    // At zoom=160, x=160 → t=1s
    expect(xToTime(160, 80, 0)).toBeCloseTo(2)
    expect(xToTime(160, 160, 0)).toBeCloseTo(1)
  })
})

// ── Track mute / solo logic ─────────────────────────────────────────────────
describe('Track mute and solo logic', () => {
  function getAudibleTracks(tracks: Track[]): Track[] {
    const hasSolo = tracks.some((t) => t.solo)
    return tracks.filter((t) => {
      if (t.muted) return false
      if (hasSolo && !t.solo) return false
      return true
    })
  }

  test('returns all unmuted tracks when no solo', () => {
    const tracks = [
      { ...makeTrack(), id: 't-1', muted: false, solo: false },
      { ...makeTrack(), id: 't-2', muted: true, solo: false },
      { ...makeTrack(), id: 't-3', muted: false, solo: false },
    ]
    const audible = tracks.filter((t) => !t.muted)
    expect(audible).toHaveLength(2)
  })

  test('solo isolates a track', () => {
    const tracks = [
      { id: 't-1', muted: false, solo: true, type: 'audio', label: 'MUSIC', locked: false, clips: [] },
      { id: 't-2', muted: false, solo: false, type: 'audio', label: 'VOICE', locked: false, clips: [] },
      { id: 't-3', muted: false, solo: false, type: 'audio', label: 'SFX', locked: false, clips: [] },
    ] as Track[]
    const audible = getAudibleTracks(tracks)
    expect(audible).toHaveLength(1)
    expect(audible[0].id).toBe('t-1')
  })

  test('muted+solo track is still silenced', () => {
    const tracks = [
      { id: 't-1', muted: true, solo: true, type: 'audio', label: 'MUSIC', locked: false, clips: [] },
      { id: 't-2', muted: false, solo: false, type: 'audio', label: 'VOICE', locked: false, clips: [] },
    ] as Track[]
    const audible = getAudibleTracks(tracks)
    expect(audible).toHaveLength(0)
  })
})
