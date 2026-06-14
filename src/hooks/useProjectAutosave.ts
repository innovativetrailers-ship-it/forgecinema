import { useEffect, useRef } from 'react'
import type { TimelineRecipe } from '@/lib/timeline/schema'
import { useUIStore } from '@/store/ui'

/** Debounced timeline save — creates project row on first save if missing. */
export function useProjectAutosave(recipe: TimelineRecipe | null | undefined): void {
  const setAutoSaveStatus = useUIStore((s) => s.setAutoSaveStatus)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!recipe?.projectId) return

    setAutoSaveStatus('unsaved')
    if (timerRef.current) clearTimeout(timerRef.current)

    timerRef.current = setTimeout(() => {
      setAutoSaveStatus('saving')
      void fetch(`/api/projects/${recipe.projectId}/save`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipe }),
      })
        .then((res) => {
          setAutoSaveStatus(res.ok ? 'saved' : 'unsaved')
        })
        .catch(() => setAutoSaveStatus('unsaved'))
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [recipe, setAutoSaveStatus])
}
