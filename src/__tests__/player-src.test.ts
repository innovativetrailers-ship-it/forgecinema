import { playerSrc } from '../lib/media/clipPlayback'

describe('player stream path', () => {
  it('plays a library id through the same-origin stream', () => {
    expect(playerSrc('/api/media/lib_1', 'lib_1')).toBe('/api/media/lib_1/stream')
  })

  it('rewrites a redirect path when the id is only in the url', () => {
    expect(playerSrc('/api/media/clip_9')).toBe('/api/media/clip_9/stream')
  })
})
