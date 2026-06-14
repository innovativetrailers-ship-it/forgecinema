/**
 * Provider-aware video dispatch — routes each model to its own client.
 * Never drag Runway/Grok/Replicate through the FAL queue.
 */

import { resolveModel } from '@/lib/models/resolve'
import { falVideo } from '@/lib/providers/falVideo'
import { grokVideo } from '@/lib/providers/grok'
import { replicateVideo } from '@/lib/providers/replicate'
import { runwayVideo } from '@/lib/providers/runway'
import { applyModeToModel } from './costGuard'
import type { GenerationMode } from './costGuard'
import type { SubProgressFn } from './types'

export interface GenerateVideoParams {
  model: string
  prompt: string
  duration: number
  imageUrl?: string
  endImageUrl?: string
  patientZeroUrl?: string
  jobId?: string
  shotIndex?: number
  generationMode?: GenerationMode
  onSubProgress?: SubProgressFn
  onPoll?: () => void | Promise<void>
}

export async function generateVideo(params: GenerateVideoParams): Promise<string> {
  const prompt = params.prompt?.trim()
  if (!prompt || prompt.length < 3) {
    throw new Error(`[generateVideo] ${params.model}: prompt empty before submit`)
  }

  const mode = params.generationMode ?? 'draft'
  const registryModel = applyModeToModel(params.model, mode)
  const def = resolveModel(registryModel)

  if (def.provider === 'elevenlabs' || def.provider === 'suno') {
    throw new Error(
      `Model '${registryModel}' is an audio provider — use the audio pipeline, not video dispatch`,
    )
  }

  console.log(
    `[dispatch] model=${params.model} → canonical=${def.canonicalId} provider=${def.provider} mode=${mode}`,
  )

  switch (def.provider) {
    case 'grok':
      return grokVideo(def, {
        prompt,
        duration: params.duration,
        imageUrl: params.imageUrl,
        onSubProgress: params.onSubProgress,
      })
    case 'runway':
      return runwayVideo(def, {
        prompt,
        duration: params.duration,
        imageUrl: params.imageUrl,
        onSubProgress: params.onSubProgress,
      })
    case 'replicate':
      return replicateVideo(def, {
        prompt,
        duration: params.duration,
        imageUrl: params.imageUrl,
        onSubProgress: params.onSubProgress,
      })
    case 'fal':
      return falVideo(def, def.canonicalId, {
        registryModel: def.canonicalId,
        prompt,
        duration: params.duration,
        imageUrl: params.imageUrl,
        endImageUrl: params.endImageUrl,
        patientZeroUrl: params.patientZeroUrl,
        jobId: params.jobId,
        shotIndex: params.shotIndex,
        onSubProgress: params.onSubProgress,
        onPoll: params.onPoll,
      })
    default:
      throw new Error(`Provider '${def.provider}' has no video client`)
  }
}
