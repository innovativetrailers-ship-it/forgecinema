import { readFileSync } from 'node:fs'
import { FAL_COSTS, creditsForRequest, hasFalPrice } from '@cinema/core'
import { directChargeCredits, quoteGenerationHold } from '@/lib/credits/quote'
import { calculateGenerationCost } from '@/lib/credits/math'

const DURATIONS = [5, 10, 15]
const TIERS = ['draft', 'standard', 'cinematic', 'film']

describe('charge matches the quote', () => {
  const priced = FAL_COSTS.filter((row) => hasFalPrice(row.modelKey)).map((row) => row.modelKey)

  it('jobs/create, the relay, and production/direct use the quote amount', () => {
    const jobs = readFileSync('src/app/api/jobs/create/route.ts', 'utf8')
    const relay = readFileSync('src/lib/desktop/generateRelay.ts', 'utf8')
    const direct = readFileSync('src/lib/orchestration/index.ts', 'utf8')
    const route = readFileSync('src/app/api/studio/production/direct/route.ts', 'utf8')
    expect(jobs).toContain('quoteGenerationHold')
    expect(jobs).toContain('checkAndDeductCredits')
    expect(relay).toContain('creditsForRequest')
    expect(direct).toContain('chargeDirectRun')
    expect(route).not.toContain('totalDuration / 5')
    const dispatch = readFileSync('src/app/api/generate/dispatch/route.ts', 'utf8')
    const decompose = readFileSync('src/app/api/generate/decompose/route.ts', 'utf8')
    expect(dispatch).toContain('directChargeCredits')
    expect(decompose).toContain('quoteGenerationHold')
  })

  it('every priced model and duration charges the quote', () => {
    for (const model of priced) {
      for (const duration of DURATIONS) {
        const quote = quoteGenerationHold({ model, durationSeconds: duration })
        expect(quote.credits).toBe(creditsForRequest(model, duration))
        expect(calculateGenerationCost(model, duration)).toBe(quote.credits)
        expect(directChargeCredits([{ model, durationSeconds: duration }])).toBe(quote.credits)
        if (model === 'hailuo-02') expect(quote.durationNote).toBe('fixed 6 s')
      }
    }
  })

  it('every tier charges the quote for its model', () => {
    for (const tier of TIERS) {
      for (const duration of DURATIONS) {
        const quote = quoteGenerationHold({ tier, durationSeconds: duration })
        expect(directChargeCredits([{ model: quote.model, durationSeconds: duration }])).toBe(quote.credits)
        expect(calculateGenerationCost(quote.model, duration)).toBe(quote.credits)
      }
    }
  })
})
