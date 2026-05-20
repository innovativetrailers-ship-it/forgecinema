import { db } from './db'

export const TIER_MONTHLY_CREDITS: Record<string, number> = {
  FREE: 50,
  PRO: 500,
  STUDIO: 2000,
  ULTIMATE: 6000,
  ADMIN: 9_999_999,
}

export const STRIPE_PRICES: Record<string, Record<string, string>> = {
  pro:      { monthly: process.env.STRIPE_PRICE_PRO_MONTHLY ?? '', yearly: process.env.STRIPE_PRICE_PRO_YEARLY ?? '' },
  studio:   { monthly: process.env.STRIPE_PRICE_STUDIO_MONTHLY ?? '', yearly: process.env.STRIPE_PRICE_STUDIO_YEARLY ?? '' },
  ultimate: { monthly: process.env.STRIPE_PRICE_ULTIMATE_MONTHLY ?? '', yearly: process.env.STRIPE_PRICE_ULTIMATE_YEARLY ?? '' },
}

export const OPERATION_COSTS: Record<string, number> = {
  // Video generation (per 5 seconds)
  generate_ltx: 1,
  generate_wan: 2,
  generate_animatediff: 1,
  generate_luma: 8,
  generate_pika: 8,
  generate_minimax: 10,
  generate_cog: 6,
  generate_kling_standard: 18,
  generate_kling_pro: 25,
  generate_seedance: 20,
  generate_runway: 22,
  generate_skyreels: 20,
  generate_veo3: 35,
  generate_sora: 40,
  generate_hunyuan: 12,
  // Processing
  relight_iclight: 2,
  upscale_4x: 3,
  face_restore: 2,
  lipsync: 5,
  transcribe: 1,
  remove_bg: 1,
  depth_map: 1,
  proxy_draft: 0, // Always free
  // Character
  lora_training: 60,
  ip_adapter_inject: 1,
  // Audio
  music_generate_30s: 5,
  music_generate_120s: 15,
  speech_generate: 3,
  foley_generate: 4,
  // 3D / CGI
  cgi_generate_3d: 20,
  cgi_composite: 5,
  // Export
  export_1080p: 8,
  export_4k: 20,
  export_dcp: 40,
  harmonise: 2,
  colour_grade: 2,
  continuity_check: 5,
  // Extras
  auto_social: 10,
  ai_director: 50,
  storyboard_gen: 15,
  // Casting & characters (per 5s clip)
  multi_character_cast_2: 5,
  multi_character_cast_3_5: 8,
  multi_character_cast_6plus: 12,
  // Makeup FX
  makeup_sfx_pregeneration: 0,
  makeup_sfx_postgeneration: 4,
  makeup_reference_transfer: 5,
  makeup_progression_set: 15,
  // Green screen & compositing
  greenscreen_chroma_key: 3,
  greenscreen_ai_matting: 6,
  backdrop_ai_generate: 10,
  backdrop_composite: 4,
  // Recasting
  recast_face_swap: 8,
  recast_full_character: 15,
  recast_project_wide: 50,
  // Film production
  film_scene_production: 20,
  film_act_assembly: 10,
  film_full_production: 100,
  // Series
  series_bible_generation: 15,
  episode_production: 50,
  social_episode: 20,
  // Reference analysis
  reference_quick_analysis: 5,
  reference_deep_analysis: 15,
  reference_script_generate: 20,
  reference_style_apply: 8,
  // Upscaling (per minute of video)
  upscale_2x_fast: 1,
  upscale_4x_standard: 3,
  upscale_4x_anime: 2,
  upscale_4x_face: 4,
  upscale_4x_maximum: 6,
  upscale_8x: 10,
  upscale_image_2x: 1,
  upscale_image_4x: 2,
  upscale_image_face: 2,
  grain_restore: 1,
  face_enhance_only: 2,
  // Advanced features
  optical_flow_retime: 3,
  morph_cut: 2,
  planar_track: 2,
  surface_replace: 3,
  video_stabilise: 1,
  auto_reframe: 2,
  clip_extend: 5,
  // Audio AI
  filler_remove: 1,
  studio_sound: 2,
  overdub_word: 3,
  video_translate: 15,
  // Content intelligence
  highlight_extract: 5,
  performance_capture: 8,
  avatar_create: 10,
  avatar_video: 5,
  talking_photo: 3,
  // Interchange & pipeline handoff
  export_interchange_native: 0,    // EDL, FCPXML, DaVinci XML — free
  export_interchange_aaf: 2,       // AAF, OTIOZ — require Python service
  // Pro Tools / audio delivery
  stem_render: 5,                  // Full stem render (dialogue/music/sfx/mx/mix)
  export_omf: 3,                   // OMF export for Pro Tools
  export_pt_xml: 0,                // Pro Tools session XML — free
  // IMF delivery
  imf_package: 40,                 // IMF APP2/APP2E/APP4DI package
  // Production tracking
  shotgrid_sync: 0,                // ShotGrid sync — free (uses own API key)
  frameio_upload: 2,               // Frame.io upload per clip
  // Media bins
  bin_auto_organise: 5,            // AI auto-organise bins with Model 1
}

export class CreditError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'CreditError'
  }
}

export async function checkAndDeductCredits(
  userId: string,
  operation: string,
  multiplier: number = 1
): Promise<void> {
  if (!(operation in OPERATION_COSTS)) {
    throw new CreditError(`Unknown operation: ${operation}`)
  }

  const cost = OPERATION_COSTS[operation] * multiplier

  if (cost === 0) return

  await db.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { creditBalance: true, role: true },
    })

    if (!user) throw new CreditError('User not found')

    // ADMIN bypass — log operation but never deduct credits
    if (user.role === 'ADMIN') {
      await tx.apiUsageLog.create({
        data: {
          provider: 'admin_bypass',
          model: operation,
          userId,
          costCents: 0,
          latencyMs: 0,
          success: true,
        },
      }).catch(() => { /* apiUsageLog may not exist yet — fail silently */ })
      return
    }

    if (user.creditBalance < cost) {
      throw new CreditError(
        `Insufficient credits. Required: ${cost}, Available: ${user.creditBalance}`
      )
    }

    await tx.user.update({
      where: { id: userId },
      data: { creditBalance: { decrement: cost } },
    })

    await tx.creditTransaction.create({
      data: {
        userId,
        amount: -cost,
        type: 'deduction',
        description: `${operation} x${multiplier}`,
      },
    })
  })
}

export async function handleSubscriptionRenewal(
  userId: string,
  planId: 'pro' | 'studio' | 'ultimate'
): Promise<void> {
  const roleMap: Record<string, string> = { pro: 'PRO', studio: 'STUDIO', ultimate: 'ULTIMATE' }
  const credits = TIER_MONTHLY_CREDITS[roleMap[planId]] ?? 0
  await db.user.update({
    where: { id: userId },
    data: { creditBalance: credits },
  })
}

export async function refundOperationCredits(
  userId: string,
  operation: string,
  reason?: string,
): Promise<void> {
  const amount = OPERATION_COSTS[operation] ?? 0
  if (amount === 0) return
  await refundCredits(userId, amount, reason ?? `Refund: ${operation}`)
}

export async function refundCredits(
  userId: string,
  amount: number,
  reason: string
): Promise<void> {
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: amount } },
    }),
    db.creditTransaction.create({
      data: {
        userId,
        amount,
        type: 'refund',
        description: reason,
      },
    }),
  ])
}

export async function addCredits(
  userId: string,
  amount: number,
  stripeId?: string
): Promise<void> {
  await db.$transaction([
    db.user.update({
      where: { id: userId },
      data: { creditBalance: { increment: amount } },
    }),
    db.creditTransaction.create({
      data: {
        userId,
        amount,
        type: 'purchase',
        description: `Purchased ${amount} credits`,
        stripeId,
      },
    }),
  ])
}
