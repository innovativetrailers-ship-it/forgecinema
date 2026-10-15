'use client'

import { useEffect, useState } from 'react'
import { create } from 'zustand'

const KEY = 'cinema-side-panel-open'

function readStored(): boolean | null {
  try {
    const value = localStorage.getItem(KEY)
    if (value === '0') return false
    if (value === '1') return true
    return null
  } catch (err) {
    console.warn('[side-panel]', err instanceof Error ? err.message : err)
    return null
  }
}

function writeStored(open: boolean): void {
  try {
    localStorage.setItem(KEY, open ? '1' : '0')
  } catch (err) {
    console.warn('[side-panel]', err instanceof Error ? err.message : err)
  }
}

interface SidePanelStore {
  open: boolean
  setOpen: (open: boolean) => void
  toggle: () => void
}

export const useSidePanel = create<SidePanelStore>((set, get) => ({
  open: true,
  setOpen: (open) => {
    writeStored(open)
    set({ open })
  },
  toggle: () => get().setOpen(!get().open),
}))

/** Restores the saved panel, closes it below 1100px, and binds `[`. */
export function SidePanelPersistence() {
  useEffect(() => {
    let lastWide = window.innerWidth >= 1100
    const applyWidth = (force: boolean) => {
      const wide = window.innerWidth >= 1100
      const crossed = wide !== lastWide
      lastWide = wide
      if (!force && !crossed) return
      const stored = readStored()
      useSidePanel.setState({ open: wide ? stored !== false : false })
    }
    applyWidth(true)
    document.documentElement.dataset.sidePanelReady = '1'
    const onResize = () => applyWidth(false)
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== '[' || event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      if (target instanceof HTMLElement && target.isContentEditable) return
      event.preventDefault()
      useSidePanel.getState().toggle()
    }
    window.addEventListener('resize', onResize)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('keydown', onKey)
    }
  }, [])
  return null
}

export function useViewportWidth(): number | null {
  const [width, setWidth] = useState<number | null>(null)
  useEffect(() => {
    const apply = () => {
      setWidth(window.innerWidth)
      document.documentElement.dataset.viewportReady = '1'
    }
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [])
  return width
}

export function useNarrowScreen(max = 700): boolean {
  const [narrow, setNarrow] = useState(false)
  useEffect(() => {
    const apply = () => setNarrow(window.innerWidth < max)
    apply()
    window.addEventListener('resize', apply)
    return () => window.removeEventListener('resize', apply)
  }, [max])
  return narrow
}
