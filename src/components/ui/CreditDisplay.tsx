'use client'

import { useCredits } from '@/hooks/useCredits'
import { Hexagon, Loader2 } from 'lucide-react'

interface CreditDisplayProps {
  onClick?: () => void
  className?: string
}

export function CreditDisplay({ onClick, className }: CreditDisplayProps) {
  const { balance, isLoading } = useCredits()

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#00e5c8]/10 border border-[#00e5c8]/20 hover:bg-[#00e5c8]/15 transition-colors ${className ?? ''}`}
    >
      <Hexagon className="w-3.5 h-3.5 text-[#00e5c8] fill-teal-400/20" />
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin text-[#00e5c8]" />
      ) : (
        <span className="text-xs font-semibold text-[#00e5c8] tabular-nums">
          {balance.toLocaleString()}
        </span>
      )}
    </button>
  )
}
