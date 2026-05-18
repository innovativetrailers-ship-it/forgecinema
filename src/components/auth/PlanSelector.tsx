'use client'

export interface Plan {
  id: string
  name: string
  monthlyPrice: number
  yearlyPrice: number
  credits: string
  features: string[]
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free Trial',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: '50 credits (once)',
    features: ['Text-to-video', 'Standard quality', 'Simple mode'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: '500 credits/month',
    features: ['Advanced timeline', 'Character vault', 'All quality tiers'],
  },
  {
    id: 'studio',
    name: 'Studio',
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: '2,000 credits/month',
    features: ['Film exports', 'Node compositor', 'Client review portal'],
    popular: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    monthlyPrice: 99,
    yearlyPrice: 990,
    credits: '6,000 credits/month',
    features: ['All features', 'AI Director', 'DCP export', 'Plugin API'],
  },
]

interface PlanSelectorProps {
  billing: 'monthly' | 'yearly'
  onBillingChange: (b: 'monthly' | 'yearly') => void
  onSelect: (planId: string) => void
}

export function PlanSelector({ billing, onBillingChange, onSelect }: PlanSelectorProps) {
  return (
    <div>
      <h2 className="text-white text-xl font-bold text-center mb-2">Choose your plan</h2>

      <div className="flex items-center justify-center gap-3 mb-6">
        <span className={`text-sm ${billing === 'monthly' ? 'text-white' : 'text-gray-500'}`}>Monthly</span>
        <button
          onClick={() => onBillingChange(billing === 'monthly' ? 'yearly' : 'monthly')}
          className="w-10 h-5 rounded-full bg-[#1a1f2e] relative transition"
        >
          <div
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-[#00e5c8] transition-all ${
              billing === 'yearly' ? 'left-5' : 'left-0.5'
            }`}
          />
        </button>
        <span className={`text-sm ${billing === 'yearly' ? 'text-white' : 'text-gray-500'}`}>
          Yearly <span className="text-[#00e5c8] text-xs">Save 2 months</span>
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {PLANS.map((plan) => (
          <button
            key={plan.id}
            onClick={() => onSelect(plan.id)}
            className={`p-4 rounded-xl border text-left transition ${
              plan.popular
                ? 'border-[#00e5c8] bg-[#00e5c8]/5'
                : 'border-[#1a2030] bg-[#151b24] hover:border-[#2a3040]'
            }`}
          >
            {plan.popular && (
              <div className="text-[#00e5c8] text-xs font-medium mb-2">Most Popular</div>
            )}
            <div className="text-white font-semibold">{plan.name}</div>
            <div className="text-2xl font-bold text-white mt-1">
              {plan.monthlyPrice === 0
                ? 'Free'
                : `$${billing === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12)}`}
              {plan.monthlyPrice > 0 && (
                <span className="text-sm text-gray-400 font-normal">/mo</span>
              )}
            </div>
            <div className="text-xs text-[#00e5c8] mt-1">{plan.credits}</div>
            <ul className="mt-3 flex flex-col gap-1">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-gray-400 flex items-center gap-1">
                  <span className="text-[#00e5c8]">✓</span> {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  )
}

export { PLANS }
