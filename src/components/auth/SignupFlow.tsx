'use client'

import { useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useSignupStore } from '@/store/signup'
import { SignupStep1 } from './SignupStep1'
import { SignupStep2 } from './SignupStep2'
import { SignupStep3 } from './SignupStep3'

export function SignupFlow() {
  const searchParams = useSearchParams()
  const { step, plan, setBilling, setPlan } = useSignupStore()

  useEffect(() => {
    const planParam = searchParams.get('plan')
    const billingParam = searchParams.get('billing')
    if (planParam) setPlan(planParam as typeof plan)
    if (billingParam === 'yearly') setBilling('yearly')
  }, [searchParams, setPlan, setBilling])

  const steps = ['Account', 'Plan', 'Payment']

  return (
    <div className="w-full max-w-lg">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="text-[#00e5c8] font-bold text-xl mb-1">Cinematic Forge</div>
        <p className="text-gray-500 text-xs">by INNOVATIVE</p>
      </div>

      {/* Step indicators */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {steps.map((label, idx) => {
          const num = (idx + 1) as 1 | 2 | 3
          const isActive = step === num
          const isDone = step > num
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
                isDone ? 'bg-[#00e5c8] text-[#0d1117]' :
                isActive ? 'border-2 border-[#00e5c8] text-[#00e5c8]' :
                'border border-[#2a3040] text-gray-600'
              }`}>
                {isDone ? '✓' : num}
              </div>
              <span className={`text-xs ${isActive ? 'text-white' : 'text-gray-600'}`}>{label}</span>
              {idx < steps.length - 1 && <div className="w-6 h-px bg-[#2a3040] mx-1" />}
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="bg-[#0f1520] border border-[#1a2030] rounded-2xl p-8">
        {step === 1 && <SignupStep1 />}
        {step === 2 && <SignupStep2 />}
        {step === 3 && <SignupStep3 />}
      </div>
    </div>
  )
}
