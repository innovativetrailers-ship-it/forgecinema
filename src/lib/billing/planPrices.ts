/**
 * Prices shown on the site. Checkout charges the Stripe price id, not this number.
 * The amounts live in @cinema/core so the desktop host reads the same figures.
 */
import { PLAN_DISPLAY_PRICES as CORE_PLAN_PRICES, formatPlanAud, type PlanDisplayPrice as CorePlan } from '@cinema/core'

export { formatPlanAud }

export interface PlanDisplayPrice extends CorePlan {
  features: string[]
  highlighted?: boolean
}

const FEATURES: Record<CorePlan['id'], { features: string[]; highlighted?: boolean }> = {
  free: { features: ['Text-to-video', 'Standard quality', 'Simple mode only', '5 exports'] },
  pro: { features: ['Advanced timeline', 'All quality tiers', 'Character vault', '500 exports'] },
  studio: { features: ['Ultimate mode', 'Film exports', 'Node compositor', 'Client review portal'], highlighted: true },
  ultimate: { features: ['All features', 'AI Director', 'DCP export', 'Plugin API', 'Priority queue'] },
}

export const PLAN_DISPLAY_PRICES: PlanDisplayPrice[] = CORE_PLAN_PRICES.map((plan) => ({
  ...plan,
  ...FEATURES[plan.id],
}))
