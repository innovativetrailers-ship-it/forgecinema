/** LTX 2.3 — replaces ltx-2-19b / ltx-video-v0-9-7 family. */

export const LTX_T2V_BY_REGISTRY: Record<string, string> = {
  'ltx-2.3':      'fal-ai/ltx-2.3/text-to-video',
  'ltx-2.3-fast': 'fal-ai/ltx-2.3/text-to-video/fast',
}

export const LTX_I2V = 'fal-ai/ltx-2.3/image-to-video' as const

export function resolveLtxEndpoint(registryKey: string, isI2V: boolean): string {
  if (isI2V) return LTX_I2V
  return LTX_T2V_BY_REGISTRY[registryKey] ?? LTX_T2V_BY_REGISTRY['ltx-2.3']
}

const LTX23_DURATIONS = [6, 8, 10] as const

function snapToNearest(raw: number, valid: readonly number[]): number {
  return valid.reduce((prev, curr) =>
    (Math.abs(curr - raw) < Math.abs(prev - raw) ? curr : prev),
  )
}

/** LTX 2.3 accepts only 6, 8, or 10 (FAL enum). */
export function snapLtx23Duration(seconds: number, _endpoint?: string): number {
  const raw = Math.round(seconds)
  if ((LTX23_DURATIONS as readonly number[]).includes(raw)) return raw
  return snapToNearest(raw, LTX23_DURATIONS)
}
