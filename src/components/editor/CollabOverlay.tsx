'use client'

import { useEditorStore } from '@/store/editor'
import { PresenceBar } from './PresenceBar'
import { ConflictToast } from './ConflictToast'

/**
 * Mounts presence + conflict watchers once a project is loaded.
 * Reads projectId from the editor store so it can be dropped into
 * any layout without needing to pass props from a server component.
 */
export function CollabOverlay() {
  const projectId = useEditorStore((s) => s.recipe?.projectId ?? null)

  if (!projectId) return null

  return (
    <>
      <PresenceBar projectId={projectId} />
      <ConflictToast projectId={projectId} />
    </>
  )
}
