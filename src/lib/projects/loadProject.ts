import { buildDefaultRecipe, isTimelineRecipe } from '@/lib/timeline/defaultRecipe'
import { reconcileTimeline } from '@/lib/timeline/reconcileTimeline'
import type { ShotPlanCard } from '@/lib/studio/shotPlan'
import type { TimelineRecipe } from '@/lib/timeline/schema'
import { usePlaybackStore } from '@/store/playbackStore'
import { useScriptStore } from '@/store/scriptStore'
import { useTimelineStore } from '@/store/timeline'

export const PROJECT_LOADED_EVENT = 'cinema:project-loaded'

export interface ProjectSummary {
  id: string
  name: string
  title?: string
  recipe?: unknown
  timelineJson?: unknown
}

export interface ProjectLoadedDetail {
  projectId: string
  recipe: TimelineRecipe
  project: ProjectSummary
  shots: ShotPlanCard[]
}

async function fetchProject(projectId: string): Promise<ProjectSummary> {
  const res = await fetch(`/api/projects/${projectId}`, { credentials: 'include' })
  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { error?: string }
    throw new Error(body.error ?? `Failed to load project (${res.status})`)
  }
  return res.json() as Promise<ProjectSummary>
}

async function fetchShots(projectId: string): Promise<ShotPlanCard[]> {
  const res = await fetch(`/api/projects/${projectId}/shots`, { credentials: 'include' })
  if (!res.ok) return []
  const data = await res.json() as { shots?: ShotPlanCard[] }
  return data.shots ?? []
}

function recipeForProject(project: ProjectSummary, projectId: string): TimelineRecipe {
  const raw = project.recipe ?? project.timelineJson
  if (isTimelineRecipe(raw)) {
    return { ...raw, projectId }
  }
  return buildDefaultRecipe(projectId)
}

/** Load a saved project into editor stores and notify open editor pages. */
export async function loadProject(projectId: string): Promise<ProjectLoadedDetail> {
  const [project, shots] = await Promise.all([
    fetchProject(projectId),
    fetchShots(projectId),
  ])

  useTimelineStore.getState().clear()
  usePlaybackStore.getState().setProjectId(projectId)
  usePlaybackStore.getState().setPlayhead(0)

  const { scriptProjectId, setScriptProjectId, clearScript } = useScriptStore.getState()
  if (scriptProjectId && scriptProjectId !== projectId) {
    clearScript()
  }
  setScriptProjectId(projectId)

  const base = recipeForProject(project, projectId)
  const { recipe } = reconcileTimeline(shots, base)

  usePlaybackStore.getState().setRecipe(recipe)

  const detail: ProjectLoadedDetail = {
    projectId,
    recipe,
    project: { ...project, name: project.name ?? project.title ?? 'Untitled Project' },
    shots,
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PROJECT_LOADED_EVENT, { detail }))
  }

  return detail
}

/** Hydrate timeline from shots for the active project (no project switch). */
export async function hydrateTimelineFromShots(
  projectId: string,
  recipe: TimelineRecipe,
): Promise<TimelineRecipe> {
  const shots = await fetchShots(projectId)
  const { recipe: next } = reconcileTimeline(shots, { ...recipe, projectId })
  usePlaybackStore.getState().setRecipe(next)
  return next
}
