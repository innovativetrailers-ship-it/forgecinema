/** Pika 2.2 — replaces legacy fal-ai/pika/v2/turbo paths. */

export const PIKA_T2V = 'fal-ai/pika/v2.2/text-to-video' as const
export const PIKA_I2V = 'fal-ai/pika/v2.2/image-to-video' as const

export function resolvePikaEndpoint(isI2V: boolean): string {
  return isI2V ? PIKA_I2V : PIKA_T2V
}

export function snapPikaDuration(seconds: number): number {
  return Math.min(10, Math.max(5, Math.round(seconds)))
}
