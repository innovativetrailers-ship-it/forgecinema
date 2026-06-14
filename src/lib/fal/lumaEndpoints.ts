/** Luma Ray 2 — replaces deprecated bare fal-ai/luma-dream-machine paths. */

export const LUMA_T2V = 'fal-ai/luma-dream-machine/ray-2' as const
export const LUMA_I2V = 'fal-ai/luma-dream-machine/ray-2/image-to-video' as const
export const LUMA_T2V_FAST = 'fal-ai/luma-dream-machine/ray-2-flash' as const

export function resolveLumaEndpoint(isI2V: boolean): string {
  return isI2V ? LUMA_I2V : LUMA_T2V
}
