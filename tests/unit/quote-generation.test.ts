import { calculateGenerationCost } from '@/lib/credits'
import { creditShortfall, quoteGenerationHold } from '@/lib/credits/quote'
import { pillQuote } from '@/components/simple/types'

const TIERS = ['draft', 'standard', 'cinematic', 'film_grade'] as const
const DURATIONS = [5, 10, 15]

describe('quoteGenerationHold', () => {
  it('matches the server simple quote for every tier and duration', () => {
    for (const tier of TIERS) {
      for (const duration of DURATIONS) {
        const button = pillQuote(tier, duration)
        const server = quoteGenerationHold({ tier, model: button.model, durationSeconds: duration })
        expect(button.credits).toBe(server.credits)
        expect(button.credits).toBe(calculateGenerationCost(button.model, button.billedDurationSeconds))
      }
    }
  })

  it('explains when cinematic costs less than standard at the same length', () => {
    const cinematic = pillQuote('cinematic', 5)
    const standard = pillQuote('standard', 5)
    expect(cinematic.credits).toBeLessThan(standard.credits)
    expect(cinematic.tierNote).toMatch(/costs less/)
  })

  it('bills a 5s LTX request as 6s', () => {
    const quote = quoteGenerationHold({ model: 'ltx-2.3-fast', durationSeconds: 5 })
    expect(quote.billedDurationSeconds).toBe(6)
    expect(quote.credits).toBe(calculateGenerationCost('ltx-2.3-fast', 6))
    expect(quote.durationNote).toMatch(/6s/)
  })

  it('does not show insufficient credits before the balance loads', () => {
    expect(creditShortfall({ balance: 0, credits: 20, loading: true }).short).toBe(false)
    expect(creditShortfall({ balance: null, credits: 20 }).generateDisabled).toBe(true)
    expect(creditShortfall({ balance: 0, credits: 20, unlimited: true }).short).toBe(false)
    expect(creditShortfall({ balance: 0, credits: 20, unlimited: true }).generateDisabled).toBe(false)
    expect(creditShortfall({ balance: 0, credits: 20, loading: false }).short).toBe(true)
  })
})
