/**
 * Layer 0 — preflight gate: block paid generation on dead endpoints, bad payloads, or insufficient credits.
 */

import { probeEndpoint } from '@/lib/fal/probeEndpoint'
import { buildFalVideoInput } from '@/lib/fal/videoPayloads'
import { calculateGenerationCost } from '@/lib/credits'
import { shotExpectedUsesI2V } from './anchorPolicy'
import { resolveFalVideoEndpoint, resolveVideoEndpoint, isExternallyRoutedModel } from './falEndpoints'
import type { DAGNode, PatientZeroAssets, StructuredShot } from './types'

export class PreflightError extends Error {
  readonly errors: PreflightErrorItem[]

  constructor(errors: PreflightErrorItem[]) {
    super(errors.map((e) => e.detail).join('; '))
    this.name = 'PreflightError'
    this.errors = errors
  }
}

export interface PreflightErrorItem {
  stage: 'endpoint' | 'adapter' | 'payload' | 'credits' | 'assets'
  shotId?: string
  detail: string
}

export interface PreflightResult {
  pass: boolean
  errors: PreflightErrorItem[]
  warnings: string[]
  estimate: { credits: number; usd: number; perShot: Record<string, number> }
}

const CREDIT_USD_RATE = 0.01

export interface PreflightInput {
  dag: DAGNode[]
  shots: StructuredShot[]
  patientZero: PatientZeroAssets
  userCredits: number
  keyframeOverheadPerShot?: number
}

export async function preflight(input: PreflightInput): Promise<PreflightResult> {
  const {
    dag,
    shots,
    patientZero,
    userCredits,
    keyframeOverheadPerShot = 1,
  } = input

  const errors: PreflightErrorItem[] = []
  const warnings: string[] = []
  const shotByIndex = new Map(shots.map((s) => [s.shotIndex, s]))

  const endpoints = new Set<string>()
  for (const node of dag) {
    const shot = shotByIndex.get(node.shot.shotIndex)
    if (!shot) continue
    const willI2V = shotExpectedUsesI2V(shot, { isVeryFirstClipOfFilm: shot.shotIndex === 0 })
    const ep = resolveVideoEndpoint(node.assignedModel, willI2V)
    if (ep && !isExternallyRoutedModel(ep)) endpoints.add(ep)
    const alt = willI2V
      ? resolveFalVideoEndpoint(node.assignedModel, 't2v')
      : resolveFalVideoEndpoint(node.assignedModel, 'i2v')
    if (alt && alt !== ep && !isExternallyRoutedModel(alt)) endpoints.add(alt)
  }

  const probes = await Promise.all([...endpoints].map((ep) => probeEndpoint(ep)))
  for (const p of probes) {
    if (p.status === 'DEAD') {
      errors.push({ stage: 'endpoint', detail: `${p.endpoint} → 404 (dead path)` })
    }
    if (p.status === 'DEPRECATED') {
      errors.push({ stage: 'endpoint', detail: `${p.endpoint} → deprecated by FAL` })
    }
    if (p.status === 'LOCKED') {
      errors.push({
        stage: 'endpoint',
        detail: `${p.endpoint} → account locked (vendor balance). Top up fal.ai/dashboard/billing`,
      })
    }
    if (p.status === 'AUTH_ERROR') {
      errors.push({
        stage: 'endpoint',
        detail: `FAL auth failed probing ${p.endpoint} (${p.code ?? 'auth'})`,
      })
    }
  }

  const perShot: Record<string, number> = {}
  for (const node of dag) {
    const shotId = String(node.shot.shotIndex)
    perShot[shotId] = node.estimatedCost

    if (isExternallyRoutedModel(node.assignedModel)) continue

    const shot = shotByIndex.get(node.shot.shotIndex)
    const vp = shot?.visualPrompt?.trim()
    if (!vp || vp.length < 3) {
      errors.push({
        stage: 'payload',
        shotId,
        detail: `Shot ${node.shot.shotIndex}: visualPrompt is empty or missing`,
      })
      continue
    }

    const willI2V = shot
      ? shotExpectedUsesI2V(shot, { isVeryFirstClipOfFilm: shot.shotIndex === 0 })
      : false
    const ep = resolveVideoEndpoint(node.assignedModel, willI2V)
    if (!ep) {
      errors.push({
        stage: 'adapter',
        shotId,
        detail: `No FAL endpoint mapped for model ${node.assignedModel}`,
      })
      continue
    }

    try {
      const payload = await buildFalVideoInput(ep, node.assignedModel, {
        prompt: vp,
        duration: node.shot.duration,
        aspectRatio: '16:9',
        imageUrl: willI2V ? (shot?.storyboardUrl ?? 'https://placeholder.invalid/frame.jpg') : undefined,
        audioPolicy: 'elevenlabs',
      })
      if (!payload.prompt || String(payload.prompt).length < 3) {
        errors.push({ stage: 'payload', shotId, detail: 'Empty prompt after adapter' })
      }
    } catch (err) {
      errors.push({
        stage: 'payload',
        shotId,
        detail: `Adapter threw: ${err instanceof Error ? err.message : String(err)}`,
      })
    }
  }

  const assetUrls = [
    ...shots.map((s) => s.storyboardUrl).filter(Boolean) as string[],
    ...patientZero.characters.map((c) => c.imageUrl),
  ]
  const uniqueAssets = [...new Set(assetUrls)]
  const assetChecks = await Promise.all(
    uniqueAssets.map(async (url) => {
      try {
        const res = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8_000) })
        return { url, ok: res.ok }
      } catch {
        return { url, ok: false }
      }
    }),
  )
  for (const a of assetChecks.filter((x) => !x.ok)) {
    warnings.push(`Asset HEAD check failed (may still work via FAL): ${a.url}`)
  }

  const totalCredits = Math.ceil(
    dag.reduce((sum, n) => sum + calculateGenerationCost(n.assignedModel, n.shot.duration), 0)
    + dag.length * keyframeOverheadPerShot,
  )

  if (userCredits < totalCredits * 1.2) {
    errors.push({
      stage: 'credits',
      detail: `Run needs ~${totalCredits} credits (+20% buffer); balance is ${userCredits}`,
    })
  }

  return {
    pass: errors.length === 0,
    errors,
    warnings,
    estimate: {
      credits: totalCredits,
      usd: totalCredits * CREDIT_USD_RATE,
      perShot,
    },
  }
}
