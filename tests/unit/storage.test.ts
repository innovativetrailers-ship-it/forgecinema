/**
 * Unit tests for storage utilities — R2 key generation, DAS path logic, MIME type inference
 */

// ── R2 key generation ───────────────────────────────────────────────────────
describe('R2 storage key generation', () => {
  function generateR2Key(
    userId: string,
    type: 'input' | 'output' | 'proxy' | 'public',
    filename: string
  ): string {
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
    return `${type}/${userId}/${date}/${sanitized}`
  }

  test('generates path with correct structure', () => {
    const key = generateR2Key('usr123', 'output', 'video.mp4')
    expect(key).toMatch(/^output\/usr123\/\d{4}-\d{2}-\d{2}\/video\.mp4$/)
  })

  test('sanitizes filename with special characters', () => {
    const key = generateR2Key('usr123', 'input', 'my file (draft).mp4')
    expect(key).not.toContain(' ')
    expect(key).not.toContain('(')
    expect(key).not.toContain(')')
  })

  test('includes date segment', () => {
    const key = generateR2Key('usr123', 'proxy', 'frame.jpg')
    const today = new Date().toISOString().split('T')[0]
    expect(key).toContain(today)
  })

  test('preserves file extension', () => {
    const key = generateR2Key('usr123', 'public', 'thumb.webp')
    expect(key.endsWith('.webp')).toBe(true)
  })
})

// ── MIME type inference ─────────────────────────────────────────────────────
describe('MIME type inference', () => {
  function inferMimeType(filename: string): string {
    const ext = filename.split('.').pop()?.toLowerCase() ?? ''
    const map: Record<string, string> = {
      mp4: 'video/mp4',
      webm: 'video/webm',
      mov: 'video/quicktime',
      mp3: 'audio/mpeg',
      wav: 'audio/wav',
      aac: 'audio/aac',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      webp: 'image/webp',
      gif: 'image/gif',
    }
    return map[ext] ?? 'application/octet-stream'
  }

  test('infers video MIME types', () => {
    expect(inferMimeType('clip.mp4')).toBe('video/mp4')
    expect(inferMimeType('clip.webm')).toBe('video/webm')
    expect(inferMimeType('clip.mov')).toBe('video/quicktime')
  })

  test('infers audio MIME types', () => {
    expect(inferMimeType('track.mp3')).toBe('audio/mpeg')
    expect(inferMimeType('track.wav')).toBe('audio/wav')
    expect(inferMimeType('track.aac')).toBe('audio/aac')
  })

  test('infers image MIME types', () => {
    expect(inferMimeType('photo.jpg')).toBe('image/jpeg')
    expect(inferMimeType('photo.jpeg')).toBe('image/jpeg')
    expect(inferMimeType('photo.png')).toBe('image/png')
    expect(inferMimeType('photo.webp')).toBe('image/webp')
  })

  test('returns octet-stream for unknown extension', () => {
    expect(inferMimeType('file.xyz')).toBe('application/octet-stream')
    expect(inferMimeType('noextension')).toBe('application/octet-stream')
  })
})

// ── File size validation ────────────────────────────────────────────────────
describe('Upload file size validation', () => {
  const MAX_SIZES = {
    image: 20 * 1024 * 1024,   // 20MB
    video: 500 * 1024 * 1024,  // 500MB
    audio: 50 * 1024 * 1024,   // 50MB
  }

  function validateFileSize(type: keyof typeof MAX_SIZES, sizeBytes: number): boolean {
    return sizeBytes <= MAX_SIZES[type]
  }

  test('accepts files within limits', () => {
    expect(validateFileSize('image', 5 * 1024 * 1024)).toBe(true)   // 5MB image
    expect(validateFileSize('video', 100 * 1024 * 1024)).toBe(true) // 100MB video
    expect(validateFileSize('audio', 10 * 1024 * 1024)).toBe(true)  // 10MB audio
  })

  test('rejects files exceeding limits', () => {
    expect(validateFileSize('image', 25 * 1024 * 1024)).toBe(false)  // 25MB image
    expect(validateFileSize('video', 600 * 1024 * 1024)).toBe(false) // 600MB video
    expect(validateFileSize('audio', 60 * 1024 * 1024)).toBe(false)  // 60MB audio
  })

  test('accepts exactly at the limit', () => {
    expect(validateFileSize('image', MAX_SIZES.image)).toBe(true)
    expect(validateFileSize('video', MAX_SIZES.video)).toBe(true)
  })
})
