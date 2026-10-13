export interface PlanDisplayPrice {
  id: 'free' | 'pro' | 'studio' | 'ultimate'
  name: string
  monthlyAud: number
  yearlyAud: number
  credits: string
}

export const PLAN_DISPLAY_PRICES: PlanDisplayPrice[] = [
  { id: 'free', name: 'Free Trial', monthlyAud: 0, yearlyAud: 0, credits: '50 credits (one-time)' },
  { id: 'pro', name: 'Pro', monthlyAud: 19, yearlyAud: 190, credits: '500 credits / month' },
  { id: 'studio', name: 'Studio', monthlyAud: 49, yearlyAud: 490, credits: '2,000 credits / month' },
  { id: 'ultimate', name: 'Ultimate', monthlyAud: 99, yearlyAud: 990, credits: '6,000 credits / month' },
]

export function formatPlanAud(amount: number): string {
  if (amount === 0) return 'Free'
  return `$${amount}`
}

export function planDisplay(id: PlanDisplayPrice['id']): PlanDisplayPrice {
  const row = PLAN_DISPLAY_PRICES.find((plan) => plan.id === id)
  if (!row) throw new Error(`Unknown plan ${id}`)
  return row
}
