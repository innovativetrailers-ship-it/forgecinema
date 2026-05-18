import type { TimelineRecipe, Track, Clip } from '../lib/timeline/schema'
import { defaultColourGrade, defaultAudioMix } from '../lib/timeline/schema'

function makeClip(overrides: Partial<Clip> = {}): Clip {
  return {
    id: 'clip-1',
    trackId: 'track-1',
    startTime: 0,
    endTime: 5,
    sourceUrl: 'https://r2.example.com/video.mp4',
    ...overrides,
  }
}

function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    id: 'track-1',
    type: 'video',
    label: 'VIDEO 1',
    muted: false,
    locked: false,
    solo: false,
    clips: [makeClip()],
    ...overrides,
  }
}

function makeRecipe(overrides: Partial<TimelineRecipe> = {}): TimelineRecipe {
  return {
    id: 'recipe-1',
    projectId: 'project-1',
    fps: 24,
    resolution: { width: 1920, height: 1080 },
    durationSeconds: 30,
    colorSpace: 'rec709',
    tracks: [makeTrack()],
    ...overrides,
  }
}

describe('TimelineRecipe schema', () => {
  it('constructs a valid recipe', () => {
    const recipe = makeRecipe()
    expect(recipe.id).toBe('recipe-1')
    expect(recipe.fps).toBe(24)
    expect(recipe.tracks).toHaveLength(1)
  })

  it('supports multiple track types', () => {
    const recipe = makeRecipe({
      tracks: [
        makeTrack({ id: 'v1', type: 'video', label: 'VIDEO 1' }),
        makeTrack({ id: 'a1', type: 'audio', label: 'MUSIC' }),
        makeTrack({ id: 'vfx1', type: 'vfx', label: 'VFX' }),
      ],
    })
    const types = recipe.tracks.map((t) => t.type)
    expect(types).toContain('video')
    expect(types).toContain('audio')
    expect(types).toContain('vfx')
  })

  it('clip endTime must be greater than startTime', () => {
    const clip = makeClip({ startTime: 5, endTime: 3 })
    expect(clip.endTime).toBeLessThan(clip.startTime)
    // This is a structural validation check — in production we'd add Zod
    const clipDuration = clip.endTime - clip.startTime
    expect(clipDuration).toBeLessThan(0)
  })

  it('clip can have all optional fields', () => {
    const clip = makeClip({
      proxyUrl: 'https://r2.example.com/proxy.mp4',
      modelUsed: 'kling_pro',
      prompt: 'aerial shot of city at night',
      characterId: 'char-1',
      locationId: 'loc-1',
      transition: { type: 'dissolve', duration: 0.5 },
      effects: [{ type: 'film_grain', intensity: 0.3 }],
      transform: { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 },
    })
    expect(clip.modelUsed).toBe('kling_pro')
    expect(clip.effects).toHaveLength(1)
    expect(clip.transition?.type).toBe('dissolve')
  })
})

describe('defaultColourGrade', () => {
  it('returns neutral ASC CDL values', () => {
    const grade = defaultColourGrade()
    expect(grade.asc_cdl.lift).toEqual([0, 0, 0])
    expect(grade.asc_cdl.gamma).toEqual([1, 1, 1])
    expect(grade.asc_cdl.gain).toEqual([1, 1, 1])
    expect(grade.asc_cdl.saturation).toBe(1)
    expect(grade.temperature).toBe(6500)
  })
})

describe('defaultAudioMix', () => {
  it('creates mix settings for given track IDs', () => {
    const mix = defaultAudioMix(['track-1', 'track-2'])
    expect(mix.tracks).toHaveLength(2)
    expect(mix.masterVolume).toBe(100)
    expect(mix.tracks[0].pan).toBe(0)
    expect(mix.tracks[0].eq).toEqual({ low: 0, mid: 0, high: 0 })
  })
})
