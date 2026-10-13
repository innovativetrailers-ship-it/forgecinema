import type { GeneratedClip } from '@/components/simple/types'
import { ensureEditorProject } from '@/lib/projects/loadProject'
import { usePlaybackStore } from '@/store/playbackStore'

export type MediaIntent = 'placement' | 'reference'

/** Finished media. Never an entity reference. */
export async function placeFinishedClip(clip: Pick<GeneratedClip, 'jobId' | 'prompt' | 'model' | 'creditsUsed' | 'duration' | 'quality' | 'aspectRatio'> & { label?: string }): Promise<{ id: string; existed: boolean }> {
  const { projectId } = await ensureEditorProject()
  const res = await fetch('/api/studio/library', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      intent: 'placement' satisfies MediaIntent,
      projectId,
      jobId: clip.jobId,
      label: (clip.label ?? clip.prompt).slice(0, 80),
      kind: 'video',
    }),
  })
  const body = await res.json() as {
    item?: { id: string; folderId: string | null; sourceUrl: string; kind: GeneratedClip['libraryKind']; label: string }
    existed?: boolean
    error?: string
  }
  if (!res.ok || !body.item) {
    throw new Error(body.error || 'Could not add the clip to the library')
  }
  const library = usePlaybackStore.getState().library
  const already = body.existed || library.some((row) => row.jobId === clip.jobId || row.mediaId === body.item?.id || row.id === body.item?.id)
  if (already) return { id: body.item.id, existed: true }
  usePlaybackStore.getState().upsertLibrary({
    id: body.item.id,
    jobId: clip.jobId,
    prompt: clip.prompt,
    model: clip.model,
    quality: clip.quality,
    creditsUsed: clip.creditsUsed,
    duration: clip.duration,
    aspectRatio: clip.aspectRatio,
    status: 'complete',
    videoUrl: body.item.sourceUrl,
    createdAt: new Date(),
    folderId: body.item.folderId,
    libraryKind: body.item.kind ?? 'video',
    mediaId: body.item.id,
    label: body.item.label,
  })
  return { id: body.item.id, existed: false }
}
