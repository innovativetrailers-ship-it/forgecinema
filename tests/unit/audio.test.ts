/**
 * Unit tests for audio processing utilities
 */

// ── Beat detection helpers ──────────────────────────────────────────────────
describe('Beat detection utilities', () => {
  function estimateBPM(beatTimestamps: number[]): number {
    if (beatTimestamps.length < 2) return 120
    const intervals: number[] = []
    for (let i = 1; i < beatTimestamps.length; i++) {
      intervals.push(beatTimestamps[i] - beatTimestamps[i - 1])
    }
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
    return Math.round(60 / avgInterval)
  }

  test('correctly estimates 120 BPM from beat timestamps', () => {
    // Beats every 0.5 seconds = 120 BPM
    const beats = [0, 0.5, 1.0, 1.5, 2.0, 2.5]
    expect(estimateBPM(beats)).toBe(120)
  })

  test('correctly estimates 60 BPM', () => {
    const beats = [0, 1.0, 2.0, 3.0, 4.0]
    expect(estimateBPM(beats)).toBe(60)
  })

  test('correctly estimates 180 BPM', () => {
    const beats = [0, 0.333, 0.666, 1.0, 1.333]
    expect(Math.abs(estimateBPM(beats) - 180)).toBeLessThan(5)
  })

  test('returns default BPM for single beat', () => {
    expect(estimateBPM([0])).toBe(120)
  })

  test('returns default BPM for empty array', () => {
    expect(estimateBPM([])).toBe(120)
  })
})

// ── Audio format validation ─────────────────────────────────────────────────
describe('Audio format validation', () => {
  const ACCEPTED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/flac', 'audio/aac', 'audio/mp4']

  function isAcceptedAudioType(mimeType: string): boolean {
    return ACCEPTED_AUDIO_TYPES.some((t) => mimeType.startsWith(t))
  }

  test('accepts common audio formats', () => {
    expect(isAcceptedAudioType('audio/mpeg')).toBe(true)
    expect(isAcceptedAudioType('audio/wav')).toBe(true)
    expect(isAcceptedAudioType('audio/ogg')).toBe(true)
    expect(isAcceptedAudioType('audio/flac')).toBe(true)
  })

  test('rejects video MIME types', () => {
    expect(isAcceptedAudioType('video/mp4')).toBe(false)
    expect(isAcceptedAudioType('video/webm')).toBe(false)
  })

  test('rejects image MIME types', () => {
    expect(isAcceptedAudioType('image/jpeg')).toBe(false)
    expect(isAcceptedAudioType('image/png')).toBe(false)
  })
})

// ── Duration formatting ─────────────────────────────────────────────────────
describe('Duration formatting', () => {
  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${String(s).padStart(2, '0')}`
  }

  test('formats seconds correctly', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(30)).toBe('0:30')
    expect(formatDuration(60)).toBe('1:00')
    expect(formatDuration(90)).toBe('1:30')
    expect(formatDuration(3600)).toBe('60:00')
  })

  test('pads single-digit seconds', () => {
    expect(formatDuration(61)).toBe('1:01')
    expect(formatDuration(65)).toBe('1:05')
  })
})
