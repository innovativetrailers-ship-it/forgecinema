'use client'

import { useState, useRef, useEffect } from 'react'
import type { ShotPlanCard } from '@/lib/studio/shotPlan'
import type { DirectShotArgs } from '@/lib/types/shot'

interface Props {
  shot: ShotPlanCard
  projectId: string
  selectedModels: string[]
  onDirect: (args: DirectShotArgs) => Promise<void>
  onAnchorChange: (shotId: string, url: string | undefined, source: ShotPlanCard['anchorSource']) => void
}

function anchorLabel(source: ShotPlanCard['anchorSource']): string {
  if (source === 'manual') return 'Custom anchor'
  if (source === 'keyframe') return 'Storyboard keyframe'
  if (source === 'auto') return 'End frame from previous shot'
  return 'No anchor (T2V)'
}

export function AwaitingDirectionCard({
  shot,
  projectId,
  selectedModels,
  onDirect,
  onAnchorChange,
}: Props) {
  const [prompt, setPrompt] = useState(shot.prompt)
  const [anchor, setAnchor] = useState<string | null>(shot.anchorFrameUrl ?? null)
  const [anchorSource, setAnchorSource] = useState<ShotPlanCard['anchorSource']>(shot.anchorSource ?? 'none')
  const [model, setModel] = useState(shot.modelOverride ?? shot.assignedModel)
  const [dialogueText, setDialogueText] = useState(shot.dialogueText ?? '')
  const [lipSyncEnabled, setLipSyncEnabled] = useState(shot.lipSyncEnabled)
  const [directing, setDirecting] = useState(false)
  const [generatingAnchor, setGeneratingAnchor] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const hasDialogue = Boolean(shot.dialogueTrackId)

  useEffect(() => {
    setPrompt(shot.prompt)
    setAnchor(shot.anchorFrameUrl ?? null)
    setAnchorSource(shot.anchorSource ?? 'none')
    setModel(shot.modelOverride ?? shot.assignedModel)
    setDialogueText(shot.dialogueText ?? '')
    setLipSyncEnabled(shot.lipSyncEnabled)
    setDirecting(false)
  }, [shot.id, shot.prompt, shot.anchorFrameUrl, shot.anchorSource, shot.assignedModel, shot.modelOverride, shot.dialogueText, shot.lipSyncEnabled])

  async function saveDialogueText() {
    if (!shot.dialogueTrackId) return
    await fetch(`/api/audio/track/${shot.dialogueTrackId}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: dialogueText }),
    })
  }

  async function regenerateVoice() {
    if (!shot.dialogueTrackId) return
    await saveDialogueText()
    await fetch(`/api/audio/track/${shot.dialogueTrackId}/generate`, {
      method: 'POST',
      credentials: 'include',
    })
  }

  async function toggleLipSync(enabled: boolean) {
    setLipSyncEnabled(enabled)
    await fetch(`/api/studio/shot/${shot.id}/settings`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lipSyncEnabled: enabled }),
    })
  }

  async function handleAnchorUpload(file: File) {
    const form = new FormData()
    form.append('file', file)
    form.append('shotId', shot.id)
    form.append('projectId', projectId)
    const res = await fetch('/api/studio/shot/anchor', { method: 'POST', credentials: 'include', body: form })
    if (!res.ok) return
    const data = await res.json() as { anchorUrl?: string }
    if (data.anchorUrl) {
      setAnchor(data.anchorUrl)
      setAnchorSource('manual')
      onAnchorChange(shot.id, data.anchorUrl, 'manual')
    }
  }

  async function handleRemoveAnchor() {
    const res = await fetch('/api/studio/shot/anchor', {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ shotId: shot.id }),
    })
    if (!res.ok) return
    setAnchor(null)
    setAnchorSource('none')
    onAnchorChange(shot.id, undefined, 'none')
  }

  async function handleGenerateAnchor() {
    if (!prompt.trim()) return
    setGeneratingAnchor(true)
    try {
      const res = await fetch('/api/studio/shot/anchor/generate', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shotId: shot.id, projectId, prompt }),
      })
      if (!res.ok) return
      const data = await res.json() as { anchorUrl?: string }
      if (data.anchorUrl) {
        setAnchor(data.anchorUrl)
        setAnchorSource('keyframe')
        onAnchorChange(shot.id, data.anchorUrl, 'keyframe')
      }
    } finally {
      setGeneratingAnchor(false)
    }
  }

  async function handleDirect() {
    if (!prompt.trim()) return
    setDirecting(true)
    try {
      await onDirect({
        shotId: shot.id,
        prompt,
        anchorSource,
        anchorFrameUrl: anchorSource === 'none' ? undefined : anchor ?? undefined,
        modelOverride: model !== shot.assignedModel ? model : undefined,
      })
    } finally {
      setDirecting(false)
    }
  }

  return (
    <div className="rounded-lg border-2 border-teal-700 bg-zinc-900 overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 bg-teal-900/30">
        <span className="text-sm font-semibold text-teal-300">
          Shot {shot.shotNumber} — Ready to Direct
        </span>
        <span className="text-xs text-zinc-400">
          {model} · {shot.duration}s · {shot.estimatedCost}cr
        </span>
      </div>

      <div className="p-3 space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-300">Start Frame (Anchor)</span>
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="text-xs px-2 py-0.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
              >
                Change
              </button>
              {anchor && (
                <button
                  type="button"
                  onClick={() => void handleRemoveAnchor()}
                  className="text-xs px-2 py-0.5 bg-zinc-700 hover:bg-red-800 text-zinc-400 rounded"
                >
                  Remove
                </button>
              )}
            </div>
          </div>

          {anchor ? (
            <div className="relative rounded overflow-hidden">
              <img src={anchor} className="w-full h-28 object-cover" alt="Anchor frame" />
              <div className="absolute bottom-1 left-1 bg-black/60 text-xs text-zinc-300 px-1 rounded">
                {anchorLabel(anchorSource)}
              </div>
            </div>
          ) : (
            <div className="w-full border border-dashed border-zinc-700 rounded p-3 space-y-2">
              <p className="text-xs text-zinc-500 text-center">
                No start frame — this shot will generate from text unless you add one.
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center">
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="text-xs px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded"
                >
                  Upload
                </button>
                <button
                  type="button"
                  onClick={() => void handleGenerateAnchor()}
                  disabled={generatingAnchor || !prompt.trim()}
                  className="text-xs px-2 py-1 bg-teal-800 hover:bg-teal-700 text-teal-100 rounded disabled:opacity-40"
                >
                  {generatingAnchor ? 'Generating…' : 'Generate start frame'}
                </button>
              </div>
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0]
              if (f) void handleAnchorUpload(f)
            }}
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-medium text-zinc-300">Direction / Prompt</span>
            {prompt !== shot.originalPrompt && (
              <button
                type="button"
                onClick={() => setPrompt(shot.originalPrompt)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                ↩ Reset
              </button>
            )}
          </div>
          <textarea
            className="w-full bg-zinc-800 border border-zinc-700 focus:border-teal-600 rounded p-2 text-sm text-zinc-200 resize-none outline-none"
            rows={4}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe this shot…"
          />
        </div>

        {hasDialogue && (
          <div className="space-y-2 border-t border-zinc-800 pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-300">Dialogue</span>
              <button
                type="button"
                onClick={() => void regenerateVoice()}
                className="text-xs text-teal-400 hover:text-teal-300"
              >
                ↺ Regenerate voice
              </button>
            </div>
            <textarea
              className="w-full bg-zinc-800 border border-zinc-700 rounded p-2 text-sm text-zinc-200 resize-none outline-none"
              rows={2}
              value={dialogueText}
              onChange={(e) => setDialogueText(e.target.value)}
              onBlur={() => void saveDialogueText()}
            />
            {shot.durationWarning && (
              <p className="text-[10px] text-amber-400">
                Line may be longer than the clip — lip sync will cut or loop.
              </p>
            )}
            <label className="flex items-center gap-2 text-xs text-zinc-400">
              <input
                type="checkbox"
                checked={lipSyncEnabled}
                onChange={(e) => void toggleLipSync(e.target.checked)}
              />
              Auto lip-sync after generation
            </label>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 flex-shrink-0">Model</span>
          <select
            className="flex-1 bg-zinc-800 border border-zinc-700 rounded px-1.5 py-1 text-xs text-zinc-200 outline-none"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            {selectedModels.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <button
          type="button"
          onClick={() => void handleDirect()}
          disabled={directing || !prompt.trim()}
          className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm py-2.5 rounded-lg flex items-center justify-center gap-2"
        >
          {directing ? (
            <>
              <span className="animate-spin">⟳</span>
              Generating…
            </>
          ) : (
            <>▶ Direct Shot {shot.shotNumber}</>
          )}
        </button>
      </div>
    </div>
  )
}
