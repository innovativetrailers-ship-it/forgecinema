/**
 * Canonical FAL endpoint registry — probe-validated source of truth.
 * Owner namespaces vary (wan, fal-ai, bytedance, alibaba). Never assume fal-ai/.
 */

import { WAN_I2V, WAN_T2V } from '@/lib/fal/wanEndpoints'
import { PIKA_I2V, PIKA_T2V } from '@/lib/fal/pikaEndpoints'
import { LUMA_I2V, LUMA_T2V } from '@/lib/fal/lumaEndpoints'
import { LTX_I2V, LTX_T2V_BY_REGISTRY } from '@/lib/fal/ltxEndpoints'
import { HUNYUAN_T2V } from '@/lib/fal/hunyuanEndpoints'
import { LIP_SYNC_ENGINES } from '@/lib/orchestration/lipSyncRegistry'

export type Provider = 'fal' | 'runway' | 'grok' | 'replicate' | 'elevenlabs' | 'suno'

export interface RegistryEntry {
  falEndpoint: string
  i2vEndpoint?: string
  /** Which API client handles generation — never assume FAL. */
  provider?: Provider
  /** @deprecated use provider !== 'fal' */
  isExternal?: boolean
}

export function entryProvider(key: string, entry: RegistryEntry): Provider {
  if (entry.provider) return entry.provider
  if (entry.isExternal) {
    if (key === 'grok-imagine-video' || key.startsWith('grok')) return 'grok'
    if (key === 'sora-2') return 'replicate'
    if (key.startsWith('runway')) return 'runway'
  }
  return 'fal'
}

/** Video generation models — council + swarm. */
export const VIDEO_MODEL_REGISTRY: Record<string, RegistryEntry> = {
  'veo-3.1':              { falEndpoint: 'fal-ai/veo3.1', i2vEndpoint: 'fal-ai/veo3.1' },
  'veo-3.1-fast':         { falEndpoint: 'fal-ai/veo3.1/fast' },
  'veo-3':                { falEndpoint: 'fal-ai/veo3' },
  'kling-3.0':            { falEndpoint: 'fal-ai/kling-video/v3/pro/text-to-video', i2vEndpoint: 'fal-ai/kling-video/v3/pro/image-to-video' },
  'kling-o3':             { falEndpoint: 'fal-ai/kling-video/o3/pro/text-to-video', i2vEndpoint: 'fal-ai/kling-video/o3/pro/image-to-video' },
  'kling-standard':       { falEndpoint: 'fal-ai/kling-video/v1.6/standard/text-to-video', i2vEndpoint: 'fal-ai/kling-video/v1.6/standard/image-to-video' },
  'seedance-2.0':         { falEndpoint: 'bytedance/seedance-2.0/text-to-video', i2vEndpoint: 'bytedance/seedance-2.0/image-to-video' },
  'runway-gen4':          { falEndpoint: 'runway-gen4', provider: 'runway', isExternal: true },
  'runway-gen4-turbo':    { falEndpoint: 'gen4_turbo', provider: 'runway', isExternal: true },
  'luma-ray3':            { falEndpoint: LUMA_T2V, i2vEndpoint: LUMA_I2V },
  'minimax-2.3':          { falEndpoint: 'fal-ai/minimax/hailuo-2.3/pro/text-to-video', i2vEndpoint: 'fal-ai/minimax/hailuo-2.3/pro/image-to-video' },
  'hailuo-2.3':           { falEndpoint: 'fal-ai/minimax/hailuo-2.3/standard/text-to-video', i2vEndpoint: 'fal-ai/minimax/hailuo-2.3/standard/image-to-video' },
  'skyreels-v3':          { falEndpoint: 'fal-ai/minimax/hailuo-2.3/standard/text-to-video', i2vEndpoint: 'fal-ai/minimax/hailuo-2.3/standard/image-to-video' },
  'wan-2.6':              { falEndpoint: WAN_T2V, i2vEndpoint: WAN_I2V },
  'wan-2.2-a14b':         { falEndpoint: 'fal-ai/wan/v2.2-a14b/text-to-video', i2vEndpoint: 'fal-ai/wan/v2.2-a14b/image-to-video' },
  /** @deprecated alias — use wan-2.2-a14b */
  'wan-2.2':              { falEndpoint: 'fal-ai/wan/v2.2-a14b/text-to-video', i2vEndpoint: 'fal-ai/wan/v2.2-a14b/image-to-video' },
  'ltx-2.3':              { falEndpoint: LTX_T2V_BY_REGISTRY['ltx-2.3'], i2vEndpoint: LTX_I2V },
  'ltx-2.3-fast':         { falEndpoint: LTX_T2V_BY_REGISTRY['ltx-2.3-fast'], i2vEndpoint: LTX_I2V },
  'pika-2.5':             { falEndpoint: PIKA_T2V, i2vEndpoint: PIKA_I2V },
  'pixverse-c1':          { falEndpoint: 'fal-ai/pixverse/v5.5/text-to-video', i2vEndpoint: 'fal-ai/pixverse/v5.5/image-to-video' },
  'pixverse-v6':          { falEndpoint: 'fal-ai/pixverse/v4.5/text-to-video', i2vEndpoint: 'fal-ai/pixverse/v4/image-to-video' },
  'hunyuan-video-1.5':    { falEndpoint: HUNYUAN_T2V },
  'hunyuan-hy-motion':    { falEndpoint: HUNYUAN_T2V },
  'hunyuan-world-mirror': { falEndpoint: HUNYUAN_T2V },
  'hunyuan-r-dmesh':      { falEndpoint: HUNYUAN_T2V },
  'happyhorse-1.0':       { falEndpoint: 'alibaba/happy-horse/text-to-video', i2vEndpoint: 'alibaba/happy-horse/image-to-video' },
  'grok-imagine-video':   { falEndpoint: 'grok-imagine-video', provider: 'grok', isExternal: true },
  'sora-2':               { falEndpoint: 'sora-2', provider: 'replicate', isExternal: true },

  // Image / utility (non-video council)
  'nano-banana-2':        { falEndpoint: 'fal-ai/gemini-25-flash-image' },
  'nano-banana-pro':      { falEndpoint: 'fal-ai/gemini-3-pro-image-preview' },
  'flux-pro':             { falEndpoint: 'fal-ai/flux-pro' },
  'flux-ultra':           { falEndpoint: 'fal-ai/flux-pro/v1.1-ultra' },
}

/** Short-name aliases → canonical registry key. */
export const MODEL_REGISTRY_ALIASES: Record<string, string> = {
  pika: 'pika-2.5',
  'pika-v2.2': 'pika-2.5',
  wan: 'wan-2.6',
  kling: 'kling-3.0',
  seedance: 'seedance-2.0',
  luma: 'luma-ray3',
  'luma-ray-2': 'luma-ray3',
  veo3: 'veo-3.1',
  'veo3.1': 'veo-3.1',
  'veo-3-1': 'veo-3.1',
  grok: 'grok-imagine-video',
  'grok-imagine': 'grok-imagine-video',
  imagine: 'grok-imagine-video',
  runway: 'runway-gen4',
  'gen4.5': 'runway-gen4',
  'gen-4.5': 'runway-gen4',
  ltx: 'ltx-2.3',
  hailuo: 'hailuo-2.3',
  minimax: 'minimax-2.3',
}

/** Lip-sync, inpaint, roto — probed separately from video models. */
export const UTILITY_FAL_ENDPOINTS: Record<string, string> = {
  latentsync:         LIP_SYNC_ENGINES.latentsync.endpoint,
  'sync-lipsync':     LIP_SYNC_ENGINES['sync-lipsync'].endpoint,
  'sync-lipsync-2-pro': LIP_SYNC_ENGINES['sync-lipsync-2-pro'].endpoint,
  'flux-fill':        'fal-ai/flux-pro/v1/fill',
  'rembg-video':      'fal-ai/birefnet/v2/video',
  'video-inpaint':    'fal-ai/wan-vace-14b/inpainting',
  'ffmpeg-extract':   'fal-ai/ffmpeg-api/extract-frame',
}

/** All unique FAL endpoint ids to probe (video t2v/i2v + utilities). */
export function listAllFalEndpointIds(): string[] {
  const ids = new Set<string>()
  for (const entry of Object.values(VIDEO_MODEL_REGISTRY)) {
    if (entry.isExternal) continue
    ids.add(entry.falEndpoint)
    if (entry.i2vEndpoint) ids.add(entry.i2vEndpoint)
  }
  for (const ep of Object.values(UTILITY_FAL_ENDPOINTS)) {
    ids.add(ep)
  }
  return [...ids].sort()
}

/** Build T2V / I2V lookup maps for orchestration (derived from registry). */
export function buildVideoEndpointMaps(): {
  t2v: Record<string, string>
  i2v: Record<string, string>
} {
  const t2v: Record<string, string> = {}
  const i2v: Record<string, string> = {}
  for (const [key, entry] of Object.entries(VIDEO_MODEL_REGISTRY)) {
    if (entry.isExternal) {
      t2v[key] = entry.falEndpoint
      continue
    }
    t2v[key] = entry.falEndpoint
    if (entry.i2vEndpoint) i2v[key] = entry.i2vEndpoint
  }
  return { t2v, i2v }
}
