'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'
import { useSignupStore, type SignupPlan } from '@/store/signup'

const PLANS: Array<{
  id: SignupPlan
  name: string
  monthlyPrice: number
  yearlyPrice: number
  credits: string
  features: string[]
  highlighted?: boolean
}> = [
  {
    id: 'free',
    name: 'Free Trial',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: '50 credits (once)',
    features: ['Text-to-video', 'Simple mode only', '5 exports'],
  },
  {
    id: 'pro',
    name: 'Pro',
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: '500 credits/month',
    features: ['Advanced timeline', 'Character vault', '500 exports'],
  },
  {
    id: 'studio',
    name: 'Studio',
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: '2,000 credits/month',
    features: ['Ultimate mode', 'Film exports', 'Review portal'],
    highlighted: true,
  },
  {
    id: 'ultimate',
    name: 'Ultimate',
    monthlyPrice: 99,
    yearlyPrice: 990,
    credits: '6,000 credits/month',
    features: ['All features', 'AI Director', 'DCP export'],
  },
]

export function SignupStep2() {
  const { plan, billing, setPlan, setBilling, setStep } = useSignupStore()
  const [selected, setSelected] = useState<SignupPlan>(plan)

  const handleContinue = () => {
    setPlan(selected)
    if (selected === 'free') {
      setStep(3)
    } else {
      setStep(3)
    }
  }

  return (
    <div>
      <h2 className="text-white font-bold text-xl mb-1">Choose your plan</h2>
      <p className="text-gray-500 text-sm mb-5">You can upgrade or downgrade at any time</p>

      {/* Billing toggle */}
      <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#1a1f2e] border border-[#2a3040] mb-5">
        {(['monthly', 'yearly'] as const).map((b) => (
          <button
            key={b}
            onClick={() => setBilling(b)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition capitalize ${
              billing === b ? 'bg-[#00e5c8] text-[#0d1117]' : 'text-gray-400 hover:text-white'
            }`}
          >
            {b}
            {b === 'yearly' && <span className="ml-1 text-[9px] font-bold opacity-80">-20%</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        {PLANS.map((p) => {
          const price = billing === 'monthly' ? p.monthlyPrice : Math.floor(p.yearlyPrice / 12)
          const isSelected = selected === p.id

          return (
            <button
              key={p.id}
              onClick={() => setSelected(p.id)}
              className={`p-4 rounded-xl border text-left transition ${
                isSelected
                  ? 'border-[#00e5c8] bg-[#00e5c8]/5'
                  : 'border-[#2a3040] hover:border-[#3a4050]'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-semibold text-sm">{p.name}</span>
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  isSelected ? 'border-[#00e5c8] bg-[#00e5c8]' : 'border-gray-600'
                }`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-[#0d1117]" />}
                </div>
              </div>
              <div className="text-xl font-bold text-white mb-0.5">
                {price === 0 ? 'Free' : `$${price}/mo`}
              </div>
              <p className="text-xs text-gray-500 mb-2">{p.credits}</p>
              <ul className="space-y-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
                    <Check size={11} className="text-[#00e5c8]" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          )
        })}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => setStep(1)}
          className="flex-1 py-2.5 rounded-lg border border-[#2a3040] text-gray-400 text-sm hover:border-[#3a4050] transition"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          className="flex-2 flex-grow py-2.5 rounded-lg bg-[#00e5c8] text-[#0d1117] font-bold text-sm hover:bg-[#00e5c8]/90 transition"
        >
          {selected === 'free' ? 'Start Free Trial' : 'Continue to Payment'}
        </button>
      </div>
    </div>
  )
}
