import {
  billedSecondsFor,
  creditFloorUsd,
  creditsForRequest,
  falUsdCost,
  hasFalPrice,
  planMargins,
  PRICE_MARKUP,
} from '@cinema/core'
import { quoteGenerationHold } from '../lib/credits/quote'
import { MODEL_COSTS, MODEL_COUNCIL_DISPLAY } from '../lib/routing/engineRegistry'

describe('fal charge table', () => {
  it('uses the ultimate credit as the floor', () => {
    expect(creditFloorUsd()).toBeCloseTo(0.0165, 6)
  })

  it('bills the verified default request, not the old per-5s table', () => {
    expect(billedSecondsFor('ltx-2.3-fast', 5)).toBe(6)
    expect(billedSecondsFor('ltx-2.3-fast', 15)).toBe(16)
    expect(billedSecondsFor('veo-3.1', 5)).toBe(6)
    expect(creditsForRequest('ltx-2.3-fast', 5)).toBe(33)
    expect(creditsForRequest('veo-3.1', 5)).toBe(110)
    expect(creditsForRequest('kling-3.0', 5)).toBe(51)
    expect(creditsForRequest('seedance-2.0', 5)).toBe(138)
    expect(falUsdCost('ltx-2.3-fast', 6)).toBeCloseTo(0.36, 6)
  })

  it('keeps every plan at or above fal cost times 1.5', () => {
    for (const [model, credits] of Object.entries(MODEL_COSTS)) {
      for (const asked of [5, 10, 15]) {
        const billed = billedSecondsFor(model, asked)
        const usd = falUsdCost(model, billed)
        const charged = creditsForRequest(model, asked)
        expect(charged).toBe(creditsForRequest(model, asked))
        for (const margin of planMargins(usd, charged)) {
          expect(margin.revenueUsd).toBeGreaterThanOrEqual(usd * PRICE_MARKUP - 1e-9)
          expect(margin.belowRule).toBe(false)
        }
      }
      expect(credits).toBe(creditsForRequest(model, 5))
    }
  })

  it('agrees across tiers, durations, and aspect ratios', () => {
    const aspects = ['16:9', '9:16', '1:1']
    for (const tier of ['draft', 'standard', 'cinematic', 'film'] as const) {
      for (const duration of [5, 10, 15]) {
        const first = quoteGenerationHold({ tier, durationSeconds: duration })
        expect(hasFalPrice(first.model)).toBe(true)
        for (const aspect of aspects) {
          const again = quoteGenerationHold({ tier, durationSeconds: duration, aspectRatio: aspect })
          expect(again.credits).toBe(first.credits)
          expect(again.model).toBe(first.model)
          expect(again.billedDurationSeconds).toBe(first.billedDurationSeconds)
        }
      }
    }
  })

  it('does not offer a model with no fal price', () => {
    expect(hasFalPrice('runway-gen4')).toBe(false)
    expect(MODEL_COSTS['runway-gen4']).toBeUndefined()
    expect(MODEL_COUNCIL_DISPLAY.map((row) => row.id)).not.toContain('runway-gen4')
    expect(() => quoteGenerationHold({ model: 'runway-gen4', durationSeconds: 5 })).toThrow(/price not set/)
  })
})
