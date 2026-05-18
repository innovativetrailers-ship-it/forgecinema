'use client'

import { useToastStore } from '@/lib/toast'
import { cn } from '@/lib/utils'
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react'

const ICON_MAP = {
  info:    <Info size={13} />,
  success: <CheckCircle2 size={13} />,
  error:   <AlertCircle size={13} />,
  warning: <AlertTriangle size={13} />,
}

const COLOUR_MAP = {
  info:    'border-[var(--border-mid)] text-[var(--text-primary)]',
  success: 'border-[var(--teal-border)] text-[var(--teal-bright)]',
  error:   'border-red-500/30 text-red-400',
  warning: 'border-yellow-500/30 text-yellow-400',
}

export function ToastContainer() {
  const { toasts, remove } = useToastStore()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'flex items-center gap-2.5 px-3 py-2.5 rounded-lg border',
            'bg-[var(--bg-elevated)] shadow-lg max-w-xs pointer-events-auto',
            'animate-in slide-in-from-bottom-2 duration-200',
            COLOUR_MAP[t.type]
          )}
        >
          <span className="shrink-0">{ICON_MAP[t.type]}</span>
          <span className="text-[12px] flex-1">{t.message}</span>
          <button
            onClick={() => remove(t.id)}
            className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      ))}
    </div>
  )
}
