/**
 * Fetch JSON without ever throwing "Unexpected end of JSON input".
 * Guards empty/non-OK responses so a flaky vault route can't crash the UI.
 */
export async function fetchJsonSafe<T>(url: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const res = await fetch(url, init)
    if (!res.ok) return fallback
    const text = await res.text()
    if (!text) return fallback
    return JSON.parse(text) as T
  } catch {
    return fallback
  }
}
