'use client'

import { planClipCopy } from '@/lib/credits/quote'

export function PlanClipLines() {
  return (
    <ul data-testid="plan-clip-lines" className="mt-8 space-y-1 text-xs text-gray-400 text-center">
      {planClipCopy().map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  )
}
