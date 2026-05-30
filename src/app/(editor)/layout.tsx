import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { TokenBar } from '@/components/layout/TokenBar'
import { FilmToolbar } from '@/components/layout/FilmToolbar'
import { EditToolbar } from '@/components/layout/EditToolbar'
import { KeyboardHandler } from '@/components/layout/KeyboardHandler'
import { CreditPurchaseModal } from '@/components/layout/CreditPurchaseModal'
import { ContextMenu } from '@/components/ui/ContextMenu'
import { CollabOverlay } from '@/components/editor/CollabOverlay'

export const metadata: Metadata = {
  title: 'Cinematic Forge — Editor',
  robots: { index: false },
}

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[var(--bg-base)]">
      {/* Fixed top bar — credits, mode switcher */}
      <TokenBar />
      {/* pt-10 accounts for the fixed 40px TokenBar */}
      <div className="flex flex-col flex-1 overflow-hidden pt-10">
        {/* Film-mode production tabs */}
        <FilmToolbar />
        {/* Edit tools: select/razor/repaint/zoom + undo/redo/add-track */}
        <EditToolbar />
        {/* Page content (advanced/simple/ultimate editor) */}
        {children}
      </div>
      {/* Global overlays — shown/hidden by Zustand state */}
      <CreditPurchaseModal />
      <ContextMenu />
      {/* Global keyboard handler — no UI rendered */}
      <KeyboardHandler />
      {/* Real-time presence indicators + conflict notifications */}
      <CollabOverlay />
    </div>
  )
}
