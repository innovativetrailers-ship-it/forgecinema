'use client'

import { useState, useEffect } from 'react'

export interface ContextMenuItem {
  label?: string
  shortcut?: string
  action?: () => void
  destructive?: boolean
  separator?: boolean
}

interface ContextMenuState {
  x: number
  y: number
  items: ContextMenuItem[]
}

// Module-level setter — allows showContextMenu() to be called from non-React code
let _setMenu: ((state: ContextMenuState | null) => void) | null = null

/**
 * Programmatically open the global context menu.
 * Call from any click handler (no React context required).
 */
export function showContextMenu(x: number, y: number, items: ContextMenuItem[]) {
  _setMenu?.({ x, y, items })
}

/**
 * Mount once in the editor layout. Renders the global context menu overlay.
 */
export function ContextMenu() {
  const [menu, setMenu] = useState<ContextMenuState | null>(null)

  // Register the module-level setter
  useEffect(() => {
    _setMenu = setMenu
    return () => { _setMenu = null }
  }, [])

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    window.addEventListener('click', close)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('click', close)
      window.removeEventListener('keydown', onKey)
    }
  }, [menu])

  if (!menu) return null

  return (
    <div
      className="fixed z-[200] bg-[#151b24] border border-[#2a3040] rounded-lg shadow-2xl py-1 min-w-[160px]"
      style={{ left: menu.x, top: menu.y }}
      onClick={(e) => e.stopPropagation()}
    >
      {menu.items.map((item, i) =>
        item.separator ? (
          <div key={i} className="my-1 h-px bg-[#1a2030]" />
        ) : (
          <button
            key={i}
            onClick={() => { item.action?.(); setMenu(null) }}
            className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between transition ${
              item.destructive
                ? 'text-red-400 hover:bg-red-500/10'
                : 'text-[var(--text-secondary)] hover:bg-white/5 hover:text-white'
            }`}
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-[var(--text-tertiary)] text-[10px] ml-4">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  )
}
