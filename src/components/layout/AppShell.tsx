'use client'

import { useUIStore } from '@/store/ui'
import { useStudioStore } from '@/store/editor'
import { TopBar } from './TopBar'
import { IconRail } from './IconRail'
import { LeftPanel } from './LeftPanel'
import { RightPanel } from './RightPanel'
import { cn } from '@/lib/utils'

interface AppShellProps {
  children: React.ReactNode
  showIconRail?: boolean
  showRightPanel?: boolean
  className?: string
}

export function AppShell({
  children,
  showIconRail = true,
  showRightPanel = false,
  className,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <TopBar />
      <div className={cn('app-body', className)}>
        {showIconRail && <IconRail />}
        <LeftPanel />
        <main className="flex-1 flex flex-col overflow-hidden min-w-0">
          {children}
        </main>
        {showRightPanel && <RightPanel />}
      </div>
    </div>
  )
}
