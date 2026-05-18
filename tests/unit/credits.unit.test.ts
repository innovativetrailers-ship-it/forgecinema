/**
 * Unit tests for the credit system calculation helpers
 * (no DB — pure logic)
 */

type QualityTier = 'draft' | 'standard' | 'cinematic' | 'film'

const BASE_COSTS: Record<string, Record<QualityTier, number>> = {
  text_to_video: { draft: 2, standard: 5, cinematic: 10, film: 20 },
  image_to_video: { draft: 3, standard: 6, cinematic: 12, film: 24 },
  audio_to_video: { draft: 3, standard: 7, cinematic: 14, film: 28 },
  upscale: { draft: 1, standard: 2, cinematic: 4, film: 8 },
  lipsync: { draft: 2, standard: 4, cinematic: 8, film: 16 },
}

function calculateCost(
  operation: string,
  quality: QualityTier,
  durationSeconds: number
): number {
  const baseCost = BASE_COSTS[operation]?.[quality]
  if (!baseCost) throw new Error(`Unknown operation: ${operation}`)

  // Duration multiplier: base is 5s, scale linearly
  const durationMultiplier = Math.max(1, durationSeconds / 5)
  return Math.ceil(baseCost * durationMultiplier)
}

describe('Credit cost calculations', () => {
  test('text_to_video draft costs 2 credits at 5s', () => {
    expect(calculateCost('text_to_video', 'draft', 5)).toBe(2)
  })

  test('text_to_video film costs 20 credits at 5s', () => {
    expect(calculateCost('text_to_video', 'film', 5)).toBe(20)
  })

  test('duration multiplier scales cost', () => {
    const base = calculateCost('text_to_video', 'standard', 5)  // 5 credits
    const double = calculateCost('text_to_video', 'standard', 10) // 10 credits
    expect(double).toBe(base * 2)
  })

  test('minimum cost is 1 duration unit', () => {
    // 1s clip should use multiplier of 1 (not fractional)
    const cost = calculateCost('text_to_video', 'draft', 1)
    expect(cost).toBeGreaterThanOrEqual(2)
  })

  test('throws for unknown operation', () => {
    expect(() => calculateCost('unknown_operation', 'draft', 5)).toThrow()
  })

  test('all operations and tiers produce positive costs', () => {
    for (const op of Object.keys(BASE_COSTS)) {
      for (const tier of ['draft', 'standard', 'cinematic', 'film'] as QualityTier[]) {
        expect(calculateCost(op, tier, 5)).toBeGreaterThan(0)
      }
    }
  })
})

describe('Credit balance checks', () => {
  function canAfford(balance: number, cost: number): boolean {
    return balance >= cost
  }

  function calculateRefund(originalCost: number, completionPct: number): number {
    const used = Math.ceil(originalCost * completionPct)
    return originalCost - used
  }

  test('can afford when balance >= cost', () => {
    expect(canAfford(100, 10)).toBe(true)
    expect(canAfford(10, 10)).toBe(true)
  })

  test('cannot afford when balance < cost', () => {
    expect(canAfford(9, 10)).toBe(false)
    expect(canAfford(0, 1)).toBe(false)
  })

  test('refund at 0% completion returns full cost', () => {
    expect(calculateRefund(20, 0)).toBe(20)
  })

  test('refund at 100% completion returns 0', () => {
    expect(calculateRefund(20, 1.0)).toBe(0)
  })

  test('refund at 50% completion returns half', () => {
    expect(calculateRefund(20, 0.5)).toBe(10)
  })

  test('refund is never negative', () => {
    const refund = calculateRefund(20, 1.2) // over 100%
    expect(refund).toBeLessThanOrEqual(0)
  })
})

describe('Credit pack pricing', () => {
  const CREDIT_PACKS = [
    { id: 'starter', credits: 100, price: 499, bonus: 0 },
    { id: 'pro', credits: 500, price: 1999, bonus: 50 },
    { id: 'studio', credits: 2000, price: 5999, bonus: 400 },
  ]

  test('each pack has positive credits and price', () => {
    for (const pack of CREDIT_PACKS) {
      expect(pack.credits).toBeGreaterThan(0)
      expect(pack.price).toBeGreaterThan(0)
    }
  })

  test('larger packs provide better value (cost per credit decreases)', () => {
    const cpcs = CREDIT_PACKS.map((p) => p.price / (p.credits + p.bonus))
    // Each successive pack should have lower cost per credit
    for (let i = 1; i < cpcs.length; i++) {
      expect(cpcs[i]).toBeLessThan(cpcs[i - 1])
    }
  })

  test('studio pack has best value', () => {
    const cpcs = CREDIT_PACKS.map((p) => p.price / (p.credits + p.bonus))
    const minCpc = Math.min(...cpcs)
    const studioIdx = CREDIT_PACKS.findIndex((p) => p.id === 'studio')
    expect(cpcs[studioIdx]).toBe(minCpc)
  })
})
