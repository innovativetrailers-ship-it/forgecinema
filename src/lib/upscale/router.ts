export type UpscaleEngine =
  | 'aura_sr'
  | 'real_esrgan'
  | 'esrgan_plus'
  | 'codeformer'
  | 'clarity_upscaler'
  | 'topaz_ffmpeg'
  | 'ffmpeg_native'

export type UpscaleFactor = 2 | 4 | 8

export interface UpscaleJob {
  inputUrl: string
  targetFactor: UpscaleFactor
  contentType: 'photorealistic' | 'anime' | 'cgi' | 'face_heavy' | 'text_heavy' | 'general'
  outputResolution?: { width: number; height: number }
  denoise: boolean
  sharpen: number
  faceEnhance: boolean
  preserveFilmGrain: boolean
  tileSize?: number
}

export interface Resolution {
  width: number
  height: number
}

export function routeUpscaleEngine(job: UpscaleJob): UpscaleEngine {
  if (job.contentType === 'face_heavy') return 'codeformer'
  if (job.contentType === 'anime') return 'real_esrgan'
  if (job.contentType === 'cgi') return 'clarity_upscaler'
  if (job.targetFactor === 8) return 'aura_sr'
  if (job.targetFactor === 4) return 'aura_sr'
  if (job.targetFactor === 2) return 'esrgan_plus'
  return 'aura_sr'
}

export function engineDisplayName(engine: UpscaleEngine): string {
  const names: Record<UpscaleEngine, string> = {
    aura_sr: 'AuraSR',
    real_esrgan: 'Real-ESRGAN',
    esrgan_plus: 'ESRGAN+',
    codeformer: 'CodeFormer',
    clarity_upscaler: 'Clarity Upscaler',
    topaz_ffmpeg: 'Topaz (FFmpeg)',
    ffmpeg_native: 'FFmpeg Native',
  }
  return names[engine]
}

export function engineDescription(engine: UpscaleEngine): string {
  const desc: Record<UpscaleEngine, string> = {
    aura_sr: 'Best for photorealistic video frames — preserves skin and texture detail',
    real_esrgan: 'Optimised for anime and illustrated content — crisp clean lines',
    esrgan_plus: 'Fast 2x general-purpose upscale',
    codeformer: 'Face-priority restoration — CodeFormer ensures sharp natural faces',
    clarity_upscaler: 'Adds diffusion-based detail for CGI and architectural shots',
    topaz_ffmpeg: 'Fast AI upscale via FFmpeg super2xsai filter',
    ffmpeg_native: 'Free bicubic/lanczos — instant, no credits required',
  }
  return desc[engine]
}

export function engineCreditKey(
  engine: UpscaleEngine,
  factor: UpscaleFactor,
  isImage: boolean
): string {
  if (isImage) {
    if (engine === 'codeformer') return 'upscale_image_face'
    if (factor === 2) return 'upscale_image_2x'
    return 'upscale_image_4x'
  }
  if (engine === 'clarity_upscaler') return 'upscale_4x_maximum'
  if (engine === 'real_esrgan') return 'upscale_4x_anime'
  if (engine === 'codeformer') return 'upscale_4x_face'
  if (factor === 8) return 'upscale_8x'
  if (factor === 4) return 'upscale_4x_standard'
  return 'upscale_2x_fast'
}
