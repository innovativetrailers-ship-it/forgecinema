/** Live FAL Kling paths — never derive I2V from T2V by suffix substitution. */

export const KLING_T2V_BY_REGISTRY: Record<string, string> = {
  'kling-3.0':      'fal-ai/kling-video/v3/pro/text-to-video',
  'kling-o3':       'fal-ai/kling-video/o3/pro/text-to-video',
  'kling-standard': 'fal-ai/kling-video/v1.6/standard/text-to-video',
}

export const KLING_I2V_BY_REGISTRY: Record<string, string> = {
  'kling-3.0':      'fal-ai/kling-video/v3/pro/image-to-video',
  'kling-o3':       'fal-ai/kling-video/o3/pro/image-to-video',
  'kling-standard': 'fal-ai/kling-video/v1.6/standard/image-to-video',
}

/** Image-conditioning param name per I2V endpoint (v3 uses start_image_url). */
export const KLING_I2V_IMAGE_PARAM: Record<string, string> = {
  'fal-ai/kling-video/v3/pro/image-to-video':        'start_image_url',
  'fal-ai/kling-video/o3/pro/image-to-video':        'image_url',
  'fal-ai/kling-video/v2.1/pro/image-to-video':    'image_url',
  'fal-ai/kling-video/v1.6/pro/image-to-video':    'image_url',
  'fal-ai/kling-video/v1.6/standard/image-to-video': 'image_url',
}

export const KLING_O3_I2V = 'fal-ai/kling-video/o3/pro/image-to-video' as const

export function resolveKlingEndpoint(registryKey: string, isI2V: boolean): string | undefined {
  return (isI2V ? KLING_I2V_BY_REGISTRY : KLING_T2V_BY_REGISTRY)[registryKey]
}

export function klingImageParamForEndpoint(falModelId: string): string {
  return KLING_I2V_IMAGE_PARAM[falModelId] ?? 'image_url'
}

export function supportsKlingEndFrame(falModelId: string): boolean {
  return falModelId.includes('/o3/')
}
