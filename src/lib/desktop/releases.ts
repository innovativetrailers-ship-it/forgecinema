/** Desktop installer URLs from the electron-updater generic feed on R2. */

export const RELEASE_FEED_BASE = 'https://releases.forgecinema.app'

export interface DesktopDownloadUrls {
  mac_arm: string
  mac_intel: string
  windows: string
  version: string | null
}

export function parseFeedVersion(yaml: string): string | null {
  const match = yaml.match(/^version:\s*(.+)$/m)
  return match?.[1]?.trim() ?? null
}

export function buildDesktopDownloadUrls(version: string): Omit<DesktopDownloadUrls, 'version'> {
  return {
    mac_arm: `${RELEASE_FEED_BASE}/CinematicForge-${version}-arm64.dmg`,
    mac_intel: `${RELEASE_FEED_BASE}/CinematicForge-${version}-x64.dmg`,
    windows: `${RELEASE_FEED_BASE}/CinematicForge-Setup-${version}.exe`,
  }
}

export const FALLBACK_DOWNLOAD_URLS: DesktopDownloadUrls = {
  version: null,
  mac_arm: `${RELEASE_FEED_BASE}/CinematicForge-arm64.dmg`,
  mac_intel: `${RELEASE_FEED_BASE}/CinematicForge-x64.dmg`,
  windows: `${RELEASE_FEED_BASE}/CinematicForge-Setup.exe`,
}

/** Fetch latest published version from R2 update feeds (best-effort). */
export async function fetchLatestDesktopDownloads(
  fetchFn: typeof fetch = fetch,
): Promise<DesktopDownloadUrls> {
  try {
    const [macRes, winRes] = await Promise.all([
      fetchFn(`${RELEASE_FEED_BASE}/latest-mac.yml`, { next: { revalidate: 300 } }),
      fetchFn(`${RELEASE_FEED_BASE}/latest.yml`, { next: { revalidate: 300 } }),
    ])
    const macYaml = macRes.ok ? await macRes.text() : ''
    const winYaml = winRes.ok ? await winRes.text() : ''
    const version = parseFeedVersion(macYaml) ?? parseFeedVersion(winYaml)
    if (!version) return FALLBACK_DOWNLOAD_URLS
    return { version, ...buildDesktopDownloadUrls(version) }
  } catch {
    return FALLBACK_DOWNLOAD_URLS
  }
}
