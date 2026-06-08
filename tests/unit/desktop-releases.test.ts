import {
  buildDesktopDownloadUrls,
  parseFeedVersion,
  RELEASE_FEED_BASE,
} from '../../src/lib/desktop/releases'

describe('desktop releases', () => {
  it('parses version from electron-updater yaml', () => {
    const yaml = `version: 3.0.1\npath: CinematicForge-3.0.1-arm64.zip\n`
    expect(parseFeedVersion(yaml)).toBe('3.0.1')
  })

  it('builds R2 download URLs from version', () => {
    const urls = buildDesktopDownloadUrls('3.0.1')
    expect(urls.mac_arm).toBe(`${RELEASE_FEED_BASE}/CinematicForge-3.0.1-arm64.dmg`)
    expect(urls.mac_intel).toBe(`${RELEASE_FEED_BASE}/CinematicForge-3.0.1-x64.dmg`)
    expect(urls.windows).toBe(`${RELEASE_FEED_BASE}/CinematicForge-Setup-3.0.1.exe`)
  })
})
