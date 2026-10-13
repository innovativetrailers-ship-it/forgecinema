import { billedSecondsFor, creditsForRequest, hasFalPrice } from '@cinema/core'
import { MissingPriceError } from '@/lib/credits/math'
import { MODEL_COUNCIL_DISPLAY, TIER_ENGINE_MAP } from '@/lib/routing/engineRegistry'

/** Registry ids the council can actually submit. Copy must use this count. */
export const COUNCIL_MODEL_COUNT = MODEL_COUNCIL_DISPLAY.length

const TIER_ORDER = ['draft', 'standard', 'cinematic', 'film'] as const

const TIER_ALIAS: Record<string, string> = {
  film_grade: 'film',
  premium: 'cinematic',
}

export interface GenerationQuote {
  model: string
  credits: number
  ratePerFiveSeconds: number
  requestedDurationSeconds: number
  billedDurationSeconds: number
  durationNote: string | null
  tierNote: string | null
}

function tierKey(tier?: string | null): string | null {
  if (!tier) return null
  return TIER_ALIAS[tier] ?? tier
}

/** Model the server will submit for this tier, unless the caller named one in the price table. */
export function quoteModel(tier?: string | null, model?: string | null): string {
  if (model) {
    if (!hasFalPrice(model)) throw new MissingPriceError(`${model} price not set`)
    return model
  }
  const key = tierKey(tier) ?? 'standard'
  const engine = TIER_ENGINE_MAP[key]
  if (!engine || !hasFalPrice(engine)) {
    throw new MissingPriceError(`no price for tier ${tier ?? 'missing'}`)
  }
  return engine
}

function billedDuration(model: string, requested: number): number {
  return billedSecondsFor(model, requested)
}

function tierNoteFor(model: string, tier?: string | null): string | null {
  const key = tierKey(tier)
  if (!key) return null
  const index = TIER_ORDER.indexOf(key as (typeof TIER_ORDER)[number])
  if (index <= 0) return null
  const lowerTier = TIER_ORDER[index - 1]
  const lowerModel = TIER_ENGINE_MAP[lowerTier]
  const rate = hasFalPrice(model) ? creditsForRequest(model, 5) : undefined
  const lowerRate = lowerModel && hasFalPrice(lowerModel) ? creditsForRequest(lowerModel, 5) : undefined
  if (typeof rate !== 'number' || typeof lowerRate !== 'number' || rate >= lowerRate) return null
  return `${key} uses ${model} at ${rate} credits for a 5s ask. ${lowerTier} uses ${lowerModel} at ${lowerRate}, so this tier costs less at the same length.`
}

/**
 * The credit number jobs/create deducts and /api/generate passes to openHold.
 * Duration is the length the model will actually render.
 */
export function quoteGenerationHold(args: {
  tier?: string | null
  model?: string | null
  durationSeconds: number
  /** These model pages do not change the per-second rate by aspect at the resolution Forge sends. */
  aspectRatio?: string | null
}): GenerationQuote {
  const model = quoteModel(args.tier, args.model)
  const requested = args.durationSeconds
  const billed = billedDuration(model, requested)
  const credits = creditsForRequest(model, requested)
  const durationNote = billed === requested
    ? null
    : `${model} cannot render ${requested}s. This request is billed and delivered as ${billed}s.`
  return {
    model,
    credits,
    ratePerFiveSeconds: creditsForRequest(model, 5),
    requestedDurationSeconds: requested,
    billedDurationSeconds: billed,
    durationNote,
    tierNote: tierNoteFor(model, args.tier),
  }
}

/** Hide the insufficient-credits line until a real balance is known. */
export function creditShortfall(args: {
  balance: number | null
  credits: number
  loading?: boolean
  unlimited?: boolean
}): { short: boolean; generateDisabled: boolean } {
  if (args.unlimited) return { short: false, generateDisabled: false }
  if (args.loading || args.balance === null) return { short: false, generateDisabled: true }
  const short = args.balance < args.credits
  return { short, generateDisabled: short }
}
