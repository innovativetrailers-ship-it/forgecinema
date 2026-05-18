'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Check } from 'lucide-react'

const PLANS = [
  {
    name: 'Free Trial',
    monthlyPrice: 0,
    yearlyPrice: 0,
    credits: '50 credits (one-time)',
    cta: 'Start Free',
    href: '/signup?plan=free',
    features: ['Text-to-video', 'Standard quality', 'Simple mode only', '5 exports'],
    highlighted: false,
  },
  {
    name: 'Pro',
    monthlyPrice: 19,
    yearlyPrice: 190,
    credits: '500 credits / month',
    cta: 'Start Pro',
    href: '/signup?plan=pro',
    features: ['Advanced timeline', 'All quality tiers', 'Character vault', '500 exports'],
    highlighted: false,
  },
  {
    name: 'Studio',
    monthlyPrice: 49,
    yearlyPrice: 490,
    credits: '2,000 credits / month',
    cta: 'Start Studio',
    href: '/signup?plan=studio',
    features: ['Ultimate mode', 'Film exports', 'Node compositor', 'Client review portal'],
    highlighted: true,
  },
  {
    name: 'Ultimate',
    monthlyPrice: 99,
    yearlyPrice: 990,
    credits: '6,000 credits / month',
    cta: 'Start Ultimate',
    href: '/signup?plan=ultimate',
    features: ['All features', 'AI Director', 'DCP export', 'Plugin API', 'Priority queue'],
    highlighted: false,
  },
]

export function PricingSection() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly')

  return (
    <section className="py-24 px-6 bg-[#080c12]">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">Simple pricing</h2>
          <p className="text-gray-400 mb-8">Start free. Scale as you create.</p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#0f1520] border border-[#1a2030]">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                billing === 'monthly' ? 'bg-[#00e5c8] text-[#0d1117]' : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('yearly')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition ${
                billing === 'yearly' ? 'bg-[#00e5c8] text-[#0d1117]' : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="ml-1.5 text-[10px] text-[#00e5c8] font-bold">-20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {PLANS.map((plan) => {
            const price = billing === 'monthly' ? plan.monthlyPrice : Math.floor(plan.yearlyPrice / 12)
            const isYearlySaving = billing === 'yearly' && plan.yearlyPrice > 0

            return (
              <div
                key={plan.name}
                className={`relative p-6 rounded-2xl border flex flex-col ${
                  plan.highlighted
                    ? 'bg-[#0f1a20] border-[#00e5c8]/50 shadow-[0_0_40px_rgba(0,229,200,0.08)]'
                    : 'bg-[#0f1520] border-[#1a2030]'
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full bg-[#00e5c8] text-[#0d1117] text-[10px] font-bold uppercase tracking-wider">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="mb-5">
                  <h3 className="text-white font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-bold text-white">
                      {price === 0 ? 'Free' : `$${price}`}
                    </span>
                    {price > 0 && <span className="text-gray-500 text-sm mb-1">/mo</span>}
                  </div>
                  {isYearlySaving && (
                    <p className="text-xs text-[#00e5c8]">Billed as ${plan.yearlyPrice}/yr</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">{plan.credits}</p>
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-gray-400">
                      <Check size={13} className="text-[#00e5c8] shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`${plan.href}&billing=${billing}`}
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center transition ${
                    plan.highlighted
                      ? 'bg-[#00e5c8] text-[#0d1117] hover:bg-[#00e5c8]/90 hover:shadow-[0_0_20px_rgba(0,229,200,0.3)]'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
