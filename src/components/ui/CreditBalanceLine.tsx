'use client'

import { cheapestAffordable } from '@/lib/credits/quote'

export function CreditBalanceLine({
  balance,
  cost,
  unlimited = false,
  options,
}: {
  balance: number | null
  cost: number
  unlimited?: boolean
  options: Array<{ label: string; credits: number }>
}) {
  if (unlimited || balance === null) return null
  const cheapest = cheapestAffordable(options, balance)
  const short = balance < cost
  const fallback = [...options].sort((a, b) => a.credits - b.credits)[0]
  return (
    <p data-testid="credit-balance-line" className="text-xs text-center text-white/60 mt-2">
      You have {balance} credits. This costs {cost}.
      {short && cheapest ? ` ${cheapest.label} fits at ${cheapest.credits}.` : ''}
      {short && !cheapest && fallback ? ` ${fallback.label} is ${fallback.credits}, still more than this balance.` : ''}
    </p>
  )
}
