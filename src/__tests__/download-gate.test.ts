import { NextRequest } from 'next/server'
import { isPlatformReleased, PLATFORM_RELEASES } from '@/lib/desktop/releases'
import { GET } from '@/app/api/desktop/download/route'

jest.mock('@/lib/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/db', () => ({ db: { user: { findUnique: jest.fn() } } }))
jest.mock('@/lib/storage/releasesR2', () => ({
  releaseObjectExists: jest.fn(),
  getSignedReleaseUrl: jest.fn(),
  releaseObjectKey: (key: string) => key,
}))

describe('download gate', () => {
  it('keeps mac 3.0.5 unreleased and treats an unknown platform as closed', () => {
    expect(PLATFORM_RELEASES.mac_arm).toEqual({ version: '3.0.5', released: false })
    expect(PLATFORM_RELEASES.mac_intel).toEqual({ version: '3.0.5', released: false })
    expect(isPlatformReleased('mac_arm')).toBe(false)
    expect(isPlatformReleased('mac_intel')).toBe(false)
    expect(isPlatformReleased('windows')).toBe(false)
    expect(isPlatformReleased(undefined)).toBe(false)
    expect(isPlatformReleased('linux')).toBe(false)
  })

  it('returns 503 and no Location header when the release flag is not true', async () => {
    for (const platform of ['mac_arm', 'mac_intel']) {
      const res = await GET(new NextRequest(`http://local/api/desktop/download?platform=${platform}`))
      expect(res.status).toBe(503)
      expect(res.headers.get('location')).toBeNull()
      const body = await res.json() as { error: string }
      expect(body.error).toBe('downloads_closed')
    }
  })
})
