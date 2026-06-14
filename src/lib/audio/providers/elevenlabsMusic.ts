import { generateSoundEffectBuffer } from '@/lib/elevenlabs/client'
import { uploadToR2 } from '@/lib/storage/r2'
import type { MusicProvider, MusicRequest, MusicResult } from './types'

export const elevenLabsMusicProvider: MusicProvider = {
  id: 'elevenlabs',
  async generate(req: MusicRequest): Promise<MusicResult> {
    const buffer = await generateSoundEffectBuffer(
      `Cinematic instrumental underscore: ${req.prompt}. Style: ${req.style ?? 'orchestral, film score'}`,
      Math.min(30, Math.max(5, req.targetSeconds)),
      0.35,
    )
    const url = await uploadToR2(buffer, `audio/music/el-${Date.now()}.mp3`, 'audio/mpeg')
    return { url, provider: 'elevenlabs' }
  },
}
