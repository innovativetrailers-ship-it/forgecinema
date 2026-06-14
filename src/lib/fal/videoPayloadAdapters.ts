/**
 * Per-endpoint FAL video payload adapters — schema-sync driven.
 * Enum durations, resolutions, and forbidden fields come from FAL OpenAPI (schemaSync).
 */

import {
  klingImageParamForEndpoint,
  supportsKlingEndFrame,
} from './klingEndpoints'
import {
  buildPayload,
  forceRefreshConstraints,
  type SchemaShotIntent,
} from './schemaSync'
import { FalValidationError } from './falErrors'

/** VLMs are always silent — soundtrack is mixed from ElevenLabs post-pipeline. */
export type AudioPolicy = 'elevenlabs'

export interface FalVideoIntent {
  prompt: string
  duration: number
  aspectRatio?: string
  imageUrl?: string
  endImageUrl?: string
  negativePrompt?: string
  quality?: string
  audioPolicy?: AudioPolicy
  seed?: number
  resolution?: string
}

/** VLMs never generate audio — ElevenLabs owns dialogue/voice. */
export const wantsNativeAudio = (_intent: FalVideoIntent): boolean => false

/** Kling v3 / o3: string enum 'auto' | '4'..'15' — kept for external callers. */
export function klingV3Duration(duration: number | string | undefined): string {
  if (duration === undefined || duration === 'auto') return 'auto'
  const n = typeof duration === 'string'
    ? parseInt(duration.replace(/s$/i, ''), 10)
    : duration
  if (Number.isNaN(n)) return 'auto'
  return String(Math.min(15, Math.max(4, Math.round(n))))
}

function isKlingV3OrO3(falModelId: string): boolean {
  return falModelId.includes('/v3/') || falModelId.includes('/o3/')
}

function intentToShot(intent: FalVideoIntent): SchemaShotIntent {
  return {
    prompt: intent.prompt,
    duration: intent.duration,
    aspectRatio: intent.aspectRatio,
    resolution: intent.resolution,
    anchorUrl: intent.imageUrl,
    imageUrl: intent.imageUrl,
    negativePrompt: intent.negativePrompt,
    quality: intent.quality,
    seed: intent.seed,
  }
}

function applyKlingExtras(
  falModelId: string,
  intent: FalVideoIntent,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...payload }

  if (intent.imageUrl) {
    const param = klingImageParamForEndpoint(falModelId)
    if (param !== 'image_url') {
      delete out.image_url
      out[param] = intent.imageUrl
    }
  }

  if (intent.endImageUrl && supportsKlingEndFrame(falModelId)) {
    out.end_image_url = intent.endImageUrl
  }

  if (isKlingV3OrO3(falModelId) && 'generate_audio' in out === false) {
    out.generate_audio = wantsNativeAudio(intent)
  }

  return out
}

function applyLtxNumFrames(
  falModelId: string,
  intent: FalVideoIntent,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (!falModelId.includes('ltx-2-19b')) return payload
  const { duration: _d, ...rest } = payload
  return {
    ...rest,
    num_frames: Math.min(Math.max(Math.round(intent.duration * 25), 49), 250),
  }
}

function applySeedanceExtras(
  falModelId: string,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (!falModelId.includes('seedance')) return payload
  return {
    ...payload,
    prompt_optimizer: payload.prompt_optimizer ?? true,
  }
}

function applyPixverseExtras(
  falModelId: string,
  intent: FalVideoIntent,
  payload: Record<string, unknown>,
): Record<string, unknown> {
  if (!falModelId.includes('pixverse/')) return payload
  const out = { ...payload }
  if (falModelId.includes('v5.5')) {
    out.generate_audio_switch = wantsNativeAudio(intent)
  }
  return out
}

export async function buildFalVideoInput(
  falModelId: string,
  _registryKey: string,
  intent: FalVideoIntent,
): Promise<Record<string, unknown>> {
  if (!intent?.prompt?.trim()) {
    throw new Error('Prompt is required for video generation')
  }

  let payload = await buildPayload(falModelId, intentToShot(intent))

  if (falModelId.includes('kling-video')) {
    payload = applyKlingExtras(falModelId, intent, payload)
  }
  payload = applyLtxNumFrames(falModelId, intent, payload)
  payload = applySeedanceExtras(falModelId, payload)
  payload = applyPixverseExtras(falModelId, intent, payload)

  assertRequiredPayloadFields(falModelId, payload)
  return payload
}

/** Build payload + retry once after 422 schema refresh (self-heal). */
export async function buildFalVideoInputWithHeal(
  falModelId: string,
  registryKey: string,
  intent: FalVideoIntent,
  submitError?: unknown,
): Promise<Record<string, unknown>> {
  if (submitError instanceof FalValidationError) {
    await forceRefreshConstraints(falModelId)
  }
  return buildFalVideoInput(falModelId, registryKey, intent)
}

/** Runtime guard — catches missing required keys before FAL submit. */
export function assertRequiredPayloadFields(
  falModelId: string,
  payload: Record<string, unknown>,
): void {
  if (!falModelId.includes('text-to-video') && !falModelId.includes('image-to-video')
    && !falModelId.includes('dream-machine') && !falModelId.includes('luma/ray')) {
    return
  }
  if (!('prompt' in payload)) {
    throw new Error(`Payload for ${falModelId} missing required field: prompt`)
  }
  const p = payload.prompt
  if (typeof p !== 'string' || p.trim().length < 3) {
    throw new Error(`Payload for ${falModelId} has empty prompt`)
  }
  if (falModelId.includes('image-to-video') && !('image_url' in payload)) {
    if (falModelId.includes('luma')) {
      throw new Error(`Payload for ${falModelId} missing required field: image_url`)
    }
  }
}
