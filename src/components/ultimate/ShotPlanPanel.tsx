'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2 } from 'lucide-react'
import { subscribeJobStream } from '@/lib/jobs/subscribeJobStream'
import { jobPlaybackPath } from '@/lib/media/jobPlayback'
import { reconcileTimelineStore } from '@/lib/timeline/reconcileTimeline'
import type { ShotPlanCard } from '@/lib/studio/shotPlan'
import type { DirectShotArgs } from '@/lib/types/shot'
import { AwaitingDirectionCard } from '@/components/ultimate/AwaitingDirectionCard'

interface Props {
  projectId: string
  script: string
  selectedModels: string[]
  mode: 'draft' | 'production'
  targetDuration: number
  onShotCompleted: (
    shotId: string,
    videoUrl: string,
    duration: number,
    extras?: { posterUrl?: string; jobId?: string },
  ) => void
  onShotReset?: (shotIds: string[]) => void
  onShotsReloaded?: (shots: ShotPlanCard[]) => void
}

export function ShotPlanPanel({
  projectId,
  script,
  selectedModels,
  mode,
  targetDuration,
  onShotCompleted,
  onShotReset,
  onShotsReloaded,
}: Props) {
  const [shots, setShots] = useState<ShotPlanCard[]>([])
  const [parsing, setParsing] = useState(false)
  const [totalCost, setTotalCost] = useState(0)
  const [parseError, setParseError] = useState<string | null>(null)
  const [directError, setDirectError] = useState<string | null>(null)

  const reload = useCallback(() => {
    return fetch(`/api/projects/${projectId}/shots`, { credentials: 'include' })
      .then((r) => r.json())
      .then((d: { shots?: ShotPlanCard[]; totalCost?: number }) => {
        const next = d.shots ?? []
        setShots(next)
        setTotalCost(d.totalCost ?? 0)
        reconcileTimelineStore(next)
        onShotsReloaded?.(next)
        return next
      })
      .catch(() => [] as ShotPlanCard[])
  }, [projectId, onShotsReloaded])

  useEffect(() => { void reload() }, [reload])

  const awaitingShot = shots.find((s) => s.status === 'awaiting_direction')
  const generatingShot = shots.find((s) => s.status === 'generating')

  useEffect(() => {
    if (!generatingShot) return
    const id = setInterval(() => { void reload() }, 3000)
    return () => clearInterval(id)
  }, [generatingShot, reload])

  async function handleParse() {
    if (!script.trim() || !selectedModels.length) return
    setParsing(true)
    setParseError(null)
    try {
      const res = await fetch('/api/studio/parse', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          script,
          selectedModels,
          duration: targetDuration,
          mode,
        }),
      })
      const data = await res.json() as { shots?: ShotPlanCard[]; totalCost?: number; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Parse failed')
      const next = data.shots ?? []
      setShots(next)
      setTotalCost(data.totalCost ?? 0)
      reconcileTimelineStore(next)
      onShotsReloaded?.(next)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Parse failed')
    } finally {
      setParsing(false)
    }
  }

  async function handleDirect(args: DirectShotArgs) {
    setDirectError(null)

    const res = await fetch('/api/studio/shot/direct', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        shotPlanId: args.shotId,
        projectId,
        mode,
        prompt: args.prompt,
        anchorSource: args.anchorSource,
        anchorFrameUrl: args.anchorFrameUrl,
        modelOverride: args.modelOverride,
        directionNotes: args.directionNotes,
      }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: 'Request failed' })) as { error?: string }
      setDirectError(typeof data.error === 'string' ? data.error : 'Could not direct shot')
      await reload()
      return
    }

    const { jobId } = await res.json() as { jobId: string }
    const shot = shots.find((s) => s.id === args.shotId)

    setShots((s) => s.map((sh) => (sh.id === args.shotId ? { ...sh, status: 'generating' } : sh)))

    subscribeJobStream(jobId, {
      onComplete: (outputUrl) => {
        void reload().then((fresh) => {
          const updated = fresh.find((s) => s.id === args.shotId)
          const playUrl = jobPlaybackPath(jobId) ?? outputUrl
          onShotCompleted(
            args.shotId,
            playUrl,
            updated?.duration ?? shot?.duration ?? 5,
            { jobId, posterUrl: updated?.lastFrame },
          )
        })
        setTimeout(() => { void reload() }, 1500)
      },
      onFailed: () => { void reload() },
    })
  }

  async function shotAction(
    url: string,
    failLabel: string,
  ): Promise<{ ok: true; data: unknown } | { ok: false }> {
    const res = await fetch(url, { method: 'POST', credentials: 'include' })
    const data = await res.json().catch(() => ({}))
    if (res.status >= 400 && res.status < 500) {
      await reload()
      if (!res.ok) setDirectError(failLabel)
      return { ok: false }
    }
    if (!res.ok) {
      setDirectError(failLabel)
      return { ok: false }
    }
    return { ok: true, data }
  }

  async function handleRegenerate(shot: ShotPlanCard) {
    const result = await shotAction(
      `/api/studio/shot/${shot.id}/reset`,
      'Cannot reset this shot right now',
    )
    if (!result.ok) return
    const data = result.data as { demotedShotIds?: string[] }
    onShotReset?.(data.demotedShotIds ?? [shot.id])
    await reload()
  }

  async function handleMarkFailed(shot: ShotPlanCard) {
    await shotAction(`/api/studio/shot/${shot.id}/fail`, 'Could not mark shot as failed')
    await reload()
  }

  const completedCount = shots.filter((s) => s.status === 'completed' || s.status === 'manual').length

  return (
    <div className="flex flex-col border border-white/10 rounded-xl overflow-hidden bg-[#0d0d14]">
      {totalCost > 0 && (
        <div className="px-3 py-2 border-b border-white/8 flex justify-between text-[10px]">
          <span className="text-white/40">{completedCount}/{shots.length} shots ready</span>
          <span className="text-[#00e5c8]">~{totalCost} credits</span>
        </div>
      )}

      {awaitingShot && (
        <div className="flex-shrink-0 p-2 border-b border-white/8">
          <AwaitingDirectionCard
            shot={awaitingShot}
            projectId={projectId}
            selectedModels={selectedModels}
            onDirect={handleDirect}
            onAnchorChange={(id, url, source) =>
              setShots((s) => s.map((sh) =>
                sh.id === id ? { ...sh, anchorFrameUrl: url, anchorSource: source } : sh,
              ))
            }
          />
        </div>
      )}

      {generatingShot && (
        <div className="flex-shrink-0 px-3 py-2 bg-yellow-900/20 border-b border-yellow-800/60">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />
              <span className="text-[11px] text-yellow-300">
                Generating Shot {generatingShot.shotNumber}…
              </span>
              <span className="text-[10px] text-white/40">
                {generatingShot.modelOverride ?? generatingShot.assignedModel}
              </span>
            </div>
            <button
              type="button"
              onClick={() => void handleMarkFailed(generatingShot)}
              className="text-[9px] text-yellow-400/70 hover:text-yellow-300 underline"
            >
              Mark failed
            </button>
          </div>
        </div>
      )}

      <div className="max-h-[240px] overflow-y-auto px-2 py-2 space-y-1">
        {shots.length === 0 ? (
          <p className="text-[10px] text-white/30 text-center py-4">
            Parse your script to build a shot-by-shot direction plan
          </p>
        ) : (
          shots
            .filter((s) => s.status !== 'awaiting_direction')
            .map((shot) => (
              <CompactShotRow
                key={shot.id}
                shot={shot}
                onRegenerate={() => void handleRegenerate(shot)}
              />
            ))
        )}
      </div>

      <div className="p-2 border-t border-white/8 space-y-1.5">
        {parseError && <p className="text-[10px] text-red-400 text-center">{parseError}</p>}
        {directError && <p className="text-[10px] text-red-400 text-center">{directError}</p>}
        <button
          type="button"
          onClick={() => void handleParse()}
          disabled={parsing || !script.trim() || !selectedModels.length}
          className="w-full py-2 rounded-lg bg-teal-600/80 hover:bg-teal-500 disabled:opacity-40 text-white text-[11px] font-semibold"
        >
          {parsing ? (
            <>
              <Loader2 className="inline w-3 h-3 animate-spin mr-1" />
              Planning…
            </>
          ) : (
            '✦ Parse & Plan Shots'
          )}
        </button>
      </div>
    </div>
  )
}

function CompactShotRow({
  shot,
  onRegenerate,
}: {
  shot: ShotPlanCard
  onRegenerate: () => void
}) {
  const statusClass =
    shot.status === 'completed' ? 'bg-teal-900/60 text-teal-400'
    : shot.status === 'failed' ? 'bg-red-900/60 text-red-400'
    : shot.status === 'manual' ? 'bg-blue-900/60 text-blue-400'
    : shot.status === 'generating' ? 'bg-yellow-900/60 text-yellow-400'
    : 'bg-white/8 text-white/40'

  const thumb = shot.lastFrame ?? shot.videoUrl

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5">
      <div className="w-10 h-7 rounded overflow-hidden bg-black/40 flex-shrink-0">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/30 text-[9px]">
            {shot.shotNumber}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <span className="text-[10px] text-white/60">Shot {shot.shotNumber}</span>
        <p className="text-[9px] text-white/35 truncate">{shot.prompt?.slice(0, 60) ?? ''}</p>
      </div>

      <span className={`text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0 ${statusClass}`}>
        {shot.status.replace('_', ' ')}
      </span>

      {(shot.status === 'completed' || shot.status === 'failed') && (
        <button
          type="button"
          onClick={onRegenerate}
          className="text-[10px] text-white/40 hover:text-white/70 flex-shrink-0"
          title="Regenerate this shot"
        >
          ↺
        </button>
      )}
    </div>
  )
}
