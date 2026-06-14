/** Map legacy worker / Simple UI model ids → MediaRouter `callEngine` registry keys. */
export const WORKER_TO_ENGINE: Record<string, string> = {
  animatediff:        'ltx-2.3-fast',
  ltx:                'ltx-2.3-fast',
  'ltx-2.3':          'ltx-2.3',
  'ltx-2.3-fast':     'ltx-2.3-fast',
  wan:                'wan-2.6',
  'wan-2.2':          'wan-2.6',
  'wan-2.6':          'wan-2.6',
  kling_pro:          'kling-3.0',
  kling_standard:     'kling-standard',
  kling:              'kling-standard',
  'kling-3.0':        'kling-3.0',
  'kling-o3':         'kling-o3',
  veo3:               'veo-3.1',
  'veo-3.1':          'veo-3.1',
  luma:               'luma-ray3',
  'luma-ray3':        'luma-ray3',
  pika:               'pika-2.5',
  'pika-2.5':         'pika-2.5',
  minimax:            'minimax-2.3',
  'minimax-2.3':      'minimax-2.3',
  seedance:           'seedance-2.0',
  'seedance-2.0':     'seedance-2.0',
  runway:             'runway-gen4',
  'runway-gen4':      'runway-gen4',
  pixverse:           'pixverse-v6',
  'pixverse-c1':      'pixverse-c1',
  'pixverse-v6':      'pixverse-v6',
  skyreels:           'skyreels-v3',
  'skyreels-v3':      'skyreels-v3',
  hunyuan:            'hunyuan-video-1.5',
  'hunyuan-video':    'hunyuan-video-1.5',
  'hunyuan-video-1.5': 'hunyuan-video-1.5',
  grok_video:         'grok-imagine-video',
  'grok-imagine-video': 'grok-imagine-video',
  sora:               'sora-2',
  'sora-2':           'sora-2',
  happyhorse:         'happyhorse-1.0',
  'happyhorse-1.0':   'happyhorse-1.0',
  hailuo:             'hailuo-2.3',
  'hailuo-2.3':       'hailuo-2.3',
}

export function resolveEngineModel(modelId: string): string {
  return WORKER_TO_ENGINE[modelId] ?? modelId
}

/** Models that return a provider job id and need async polling (not blocking FAL subscribe). */
export const ASYNC_POLL_ENGINES = new Set([
  'runway',
  'runway-gen4',
  'sora',
  'sora-2',
])
