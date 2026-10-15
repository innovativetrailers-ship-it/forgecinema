'use client'

import { useRef, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ScrollStrip({ label, children }: { label: string; children: ReactNode }) {
  const scroller = useRef<HTMLDivElement>(null)
  const move = (direction: number) => {
    scroller.current?.scrollBy({ left: direction * 180, behavior: 'smooth' })
  }
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <button type="button" aria-label={`Scroll ${label} left`} onClick={() => move(-1)} className="shrink-0 px-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
        <ChevronLeft size={14} />
      </button>
      <div
        ref={scroller}
        className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none]"
        style={{ maskImage: 'linear-gradient(90deg, transparent, #000 8px, #000 calc(100% - 8px), transparent)' }}
      >
        {children}
      </div>
      <button type="button" aria-label={`Scroll ${label} right`} onClick={() => move(1)} className="shrink-0 px-1 text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
        <ChevronRight size={14} />
      </button>
    </div>
  )
}
