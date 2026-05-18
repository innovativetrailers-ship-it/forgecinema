'use client'

import { TRANSITION_PRESETS } from './constants'

interface Props {
  userRole: string
  onTransitionSelect: (transitionId: string) => void
}

const CATEGORIES = ['Basic', 'Cinematic', 'Motion', 'FX']

export function TransitionsPanel({ userRole, onTransitionSelect }: Props) {
  const isPro = userRole === 'PRO' || userRole === 'STUDIO' || userRole === 'ADMIN'

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-white/8">
        <p className="text-[11px] font-semibold text-white/40 uppercase tracking-wider">Transitions</p>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {CATEGORIES.map((cat) => {
          const items = TRANSITION_PRESETS.filter((t) => t.category === cat)
          if (!items.length) return null
          return (
            <div key={cat} className="mb-4">
              <p className="text-[10px] text-white/30 uppercase tracking-wider mb-2 px-1">{cat}</p>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((t) => {
                  const locked = !t.free && !isPro
                  return (
                    <button
                      key={t.id}
                      onClick={() => !locked && onTransitionSelect(t.id)}
                      disabled={locked}
                      title={locked ? 'Requires PRO' : t.label}
                      className={`
                        flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all
                        ${locked
                          ? 'border-white/5 bg-white/2 text-white/20 cursor-not-allowed'
                          : 'border-white/8 bg-white/3 hover:border-[#00e5c8]/40 hover:bg-[#00e5c8]/8 text-white/60 hover:text-white cursor-pointer'}
                      `}
                    >
                      <span className="text-lg leading-none">{t.icon}</span>
                      <span className="text-[10px] font-medium">{t.label}</span>
                      {locked && <span className="text-[9px] text-white/20">PRO</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
