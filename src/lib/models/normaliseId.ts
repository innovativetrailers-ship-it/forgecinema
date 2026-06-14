import type { VideoModel } from './types'

/** Canonical kebab-case council IDs used in director plans and UI. */
export function normaliseModelId(id: string | undefined): string {
  if (!id?.trim()) {
    throw new Error('normaliseModelId: model id is required — cannot default to a fallback model')
  }
  const legacyMap: Record<string, string> = {
    wan_2_2:        'wan-2.6',
    wan_2_6:        'wan-2.6',
    wan:            'wan-2.6',
    'wan-2.2':      'wan-2.6',
    kling_pro:      'kling-3.0',
    kling_standard: 'kling-3.0',
    'kling-standard': 'kling-3.0',
    veo3:           'veo-3.1',
    luma:           'luma-ray3',
    seedance:       'seedance-2.0',
    ltx:            'ltx-2.3',
    'ltx-2.3-fast': 'ltx-2.3-fast',
    pika:           'pika-2.5',
    minimax:        'minimax-2.3',
    pixverse:       'pixverse-c1',
    skyreels:       'skyreels-v3',
    hunyuan:        'hunyuan-video-1.5',
    happyhorse:     'happyhorse-1.0',
    sora:           'sora-2',
    runway:         'runway-gen4',
    grok:           'grok-imagine-video',
    'grok-imagine': 'grok-imagine-video',
    imagine:        'grok-imagine-video',
    grok_video:     'grok-imagine-video',
    animatediff:    'ltx-2.3-fast',
    hailuo:         'hailuo-2.3',
    'nano-banana-2':   'nano-banana-2',
    'nano-banana-pro': 'nano-banana-pro',
  }
  return legacyMap[id] ?? id
}

/** Map any model ID variant to legacy VideoModel for credits and worker billing. */
export function normalizeWorkerModelId(modelId: string): VideoModel {
  const kebab = normaliseModelId(modelId)
  const legacyMap: Record<string, VideoModel> = {
    'wan-2.6':           'wan',
    'kling-3.0':         'kling_pro',
    'kling-o3':          'kling_pro',
    'veo-3.1':           'veo3',
    'luma-ray3':         'luma',
    'seedance-2.0':      'seedance',
    'ltx-2.3':           'ltx',
    'ltx-2.3-fast':      'ltx',
    'pika-2.5':          'pika',
    'minimax-2.3':       'minimax',
    'pixverse-c1':       'pixverse',
    'skyreels-v3':       'skyreels',
    'hunyuan-video-1.5': 'hunyuan',
    'happyhorse-1.0':    'happyhorse',
    'sora-2':            'sora',
    'runway-gen4':       'runway',
    'grok-imagine-video': 'grok_video',
    'hailuo-2.3':        'hailuo',
    'nano-banana-2':     'wan',
    'nano-banana-pro':   'wan',
  }
  return legacyMap[kebab] ?? (kebab as VideoModel)
}
