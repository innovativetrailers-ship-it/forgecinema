/** Hunyuan Video — bare T2V path only (no I2V on FAL). */

export const HUNYUAN_T2V = 'fal-ai/hunyuan-video' as const

export function resolveHunyuanEndpoint(_isI2V: boolean): string {
  return HUNYUAN_T2V
}
