import { fal } from '@/lib/fal/client'
import type { FCCCharacter } from './fccSchema'
import { animatePortraitWithMotion } from './mocap'
import type { FccRotoMode } from './characterMotion'

function extractVideoUrl(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null
  const d = data as Record<string, unknown>
  const video = d.video as { url?: string } | undefined
  if (video?.url) return video.url
  if (typeof d.video_url === 'string') return d.video_url
  return null
}

export async function rotoAndOverlay(
  liveVideoUrl: string,
  mode: FccRotoMode,
  character?: FCCCharacter,
): Promise<string> {
  const rotoResult = await fal.subscribe('fal-ai/rembg-video', {
    input: { video_url: liveVideoUrl, return_mask: true },
  })
  const rotoData = rotoResult.data as Record<string, unknown>
  const maskUrl = typeof rotoData.mask_url === 'string' ? rotoData.mask_url : null

  if (mode === 'character' && character?.refFront) {
    const charUrl = await animatePortraitWithMotion(character.refFront, liveVideoUrl, {
      prompt: character.behavioralPrompt || `${character.name} matching live action energy`,
      portraitLabel: character.name,
    })
    const composite = await fal.subscribe('fal-ai/video-inpaint', {
      input: {
        base_video_url: liveVideoUrl,
        replacement_video_url: charUrl,
        mask_video_url: maskUrl ?? liveVideoUrl,
        blend_edges: true,
      },
    })
    const out = extractVideoUrl(composite.data)
    if (!out) throw new Error('Roto composite returned no video.')
    return out
  }

  if (mode === 'aura') {
    const glow = await fal.subscribe('fal-ai/video-upscaler', {
      input: { video_url: liveVideoUrl, scale: 1 },
    })
    const out = extractVideoUrl(glow.data) ?? liveVideoUrl
    return out
  }

  const vfx = await fal.subscribe('fal-ai/video-inpaint', {
    input: {
      base_video_url: liveVideoUrl,
      replacement_video_url: liveVideoUrl,
      mask_video_url: maskUrl ?? liveVideoUrl,
      blend_edges: true,
    },
  })
  const out = extractVideoUrl(vfx.data)
  if (!out) throw new Error('VFX overlay returned no video.')
  return out
}
