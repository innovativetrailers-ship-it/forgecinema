'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useSidePanel } from './useSidePanel'

export function SideColumn({ children }: { children: ReactNode }) {
  const open = useSidePanel((s) => s.open)
  const setOpen = useSidePanel((s) => s.setOpen)
  const inner = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const node = inner.current
    if (!node) return
    const measure = () => setWidth(node.scrollWidth)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      data-side-panel
      data-open={open ? 'true' : 'false'}
      className="relative h-full shrink-0 overflow-hidden motion-reduce:transition-none motion-safe:transition-[width] motion-safe:duration-200"
      style={{ width: open ? width : 0 }}
    >
      <div ref={inner} aria-hidden={open ? undefined : true} className={`flex h-full w-max ${open ? '' : 'invisible'}`}>
        {children}
      </div>
      {open && (
        <button
          type="button"
          title="Close panel"
          aria-label="Close panel"
          data-panel-toggle="close"
          onClick={() => setOpen(false)}
          className="absolute right-0 top-1/2 z-40 grid h-8 w-4 -translate-y-1/2 place-items-center rounded-l border border-white/15 bg-[#121826] text-white/70"
        >
          <ChevronLeft size={14} />
        </button>
      )}
    </div>
  )
}
