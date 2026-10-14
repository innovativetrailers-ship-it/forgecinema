// src/lib/orchestration/fastEstimate.ts
// Instant cost + render-time estimate — zero API calls.
// Used by the Vercel route to stay well under its 30s maxDuration.

import { creditsForRequest, hasFalPrice } from '@cinema/core'

/**
 * Estimate credit cost WITHOUT calling Claude.
 * Holds the dearest selected model's quote. The worker settles the shots it actually submits.
 */
export function fastEstimateCost(
  selectedModels: string[],
  duration:       number
): number {
  const priced = selectedModels.filter((model) => hasFalPrice(model))
  if (priced.length === 0) return 0
  return Math.max(...priced.map((model) => creditsForRequest(model, duration)))
}

/**
 * Estimate render time in seconds — used for the initial ETA before real progress.
 * Based on observed fal.ai generation times per model tier.
 */
export function estimateRenderSeconds(
  selectedModels: string[],
  duration:       number
): number {
  const estimatedSegments = Math.max(1, Math.ceil(duration / 6))
  const perSegment        = 45  // seconds — premium models are slower, drafts faster
  return (estimatedSegments * perSegment) + 20 + 30  // +20s patient zero, +30s stitching
}
