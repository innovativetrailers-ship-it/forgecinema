import { MODEL_COSTS } from '@/lib/routing/engineRegistry'

export class MissingPriceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'MissingPriceError'
  }
}

export function asPositive(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n) || n <= 0) return null
  return n
}

/** Credits for one model at one length. Rate is credits per 5 seconds. */
export function calculateGenerationCost(
  model: string,
  durationSeconds: number,
  shotNumber?: number,
): number {
  const ratePerFiveSeconds = MODEL_COSTS[model]
  const seconds = asPositive(durationSeconds)
  console.log('[cost_inputs]', JSON.stringify({
    model,
    durationSeconds,
    ratePerFiveSeconds,
    shot: shotNumber ?? null,
  }))
  if (typeof ratePerFiveSeconds !== 'number' || !Number.isFinite(ratePerFiveSeconds) || ratePerFiveSeconds <= 0) {
    throw new MissingPriceError(`no price for model ${model}`)
  }
  if (seconds == null) {
    throw new MissingPriceError(
      shotNumber == null
        ? `duration unresolved for shot priced with ${model}`
        : `duration unresolved for shot ${shotNumber}`,
    )
  }
  const credits = Math.ceil((ratePerFiveSeconds / 5) * seconds)
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new MissingPriceError(`no price for model ${model}`)
  }
  return credits
}
