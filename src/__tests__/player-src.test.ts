import { playerSrc } from '../lib/media/clipPlayback'

describe('player stream path', () => {
  it('plays a library id through the same-origin stream', () => {
    expect(playerSrc('/api/media/lib_1', 'lib_1')).toBe('/api/media/lib_1/stream')
  })

  it('rewrites a redirect path when the id is only in the url', () => {
    expect(playerSrc('/api/media/clip_9')).toBe('/api/media/clip_9/stream')
  })

  it('rewrites a stored library path that was saved before the stream route', () => {
    expect(playerSrc('/api/media/lib_JfKGYWXZtjRq5lUXcmGXG')).toBe('/api/media/lib_JfKGYWXZtjRq5lUXcmGXG/stream')
  })

  it('rewrites an object-storage url for this bucket to the stream route', () => {
    const signed = 'https://forge.example.r2.cloudflarestorage.com/media/lib_old.mp4?X-Amz-Signature=abc'
    expect(playerSrc(signed)).toBe('/api/media/lib_old/stream')
  })
})
