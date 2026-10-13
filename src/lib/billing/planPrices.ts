/**
 * Prices shown on the site. Checkout charges the Stripe price id, not this number.
 * Confirm a mismatch against the live Stripe price before changing either side.
 */
export interface PlanDisplayPrice {
  id: 'free' | 'pro' | 'studio' | 'ultimate'
  name: string
  monthlyAud: number
  yearlyAud: number
  credits: string
  features: string[]
  highlighted?: boolean
}

export const PLAN_DISPLAY_PRICES: PlanDisplayPrice[] = [
  {
    id: 'free',
    name: 'Free Trial',
    monthlyAud: 0,
    yearlyAud: 0,
    credits: '50 credits (one-time)',
    features: ['Text-to-video', 'Standard quality', 'Simple mode only', '5 exports'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyAud: 19,
    yearlyAud: 190,
    credits: '500 credits / month',
    features: ['Advanced timeline', 'All quality tiers', 'Character vault', '500 exports'],
  },
  {
    id: 'studio',
    name: 'Studio',
    monthlyAud: 49,
    yearlyAud: 490,
    credits: '2,000 credits / month',
    features: ['Ultimate mode', 'Film exports', 'Node compositor', 'Client review portal'],
    highlighted: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    monthlyAud: 99,
    yearlyAud: 990,
    credits: '6,000 credits / month',
    features: ['All features', 'AI Director', 'DCP export', 'Plugin API', 'Priority queue'],
  },
]

export function formatPlanAud(amount: number): string {
  if (amount === 0) return 'Free'
  return `A$${amount} AUD`
}
