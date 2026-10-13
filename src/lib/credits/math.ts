import { creditsForRequest, hasFalPrice } from '@cinema/core'

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
  const seconds = asPositive(durationSeconds)
  console.log('[cost_inputs]', JSON.stringify({
    model,
    durationSeconds,
    priced: hasFalPrice(model),
    shot: shotNumber ?? null,
  }))
  if (!hasFalPrice(model)) throw new MissingPriceError(`${model} price not set`)
  if (seconds == null) {
    throw new MissingPriceError(
      shotNumber == null
        ? `duration unresolved for shot priced with ${model}`
        : `duration unresolved for shot ${shotNumber}`,
    )
  }
  const credits = creditsForRequest(model, seconds)
  if (!Number.isFinite(credits) || credits <= 0) {
    throw new MissingPriceError(`no price for model ${model}`)
  }
  return credits
}
