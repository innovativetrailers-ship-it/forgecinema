'use client'

import { useState, useEffect } from 'react'
import { X, RefreshCw, Loader2, Check } from 'lucide-react'
import type { Clip } from '@/lib/timeline/schema'

interface Props {
  clip: Clip
  surroundingClips: Clip[]
  onClose: () => void
  onRepaintComplete: (clipId: string, newVideoUrl: string) => void
}

const MODELS = [
  { value: 'auto', label: 'Auto (locked model)' },
  { value: 'kling_standard', label: 'Kling Standard' },
  { value: 'kling_pro', label: 'Kling Pro' },
  { value: 'veo3', label: 'Veo 3' },
  { value: 'seedance', label: 'Seedance' },
  { value: 'runway', label: 'Runway Gen-4' },
]

export function RepaintModal({ clip, surroundingClips, onClose, onRepaintComplete }: Props) {
  const [newPrompt, setNewPrompt] = useState(clip.prompt ?? '')
  const [model, setModel] = useState('auto')
  const [motionMatch, setMotionMatch] = useState(true)
  const [isRepainting, setIsRepainting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMsg, setProgressMsg] = useState('')

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleRepaint = async () => {
    if (!newPrompt.trim() || isRepainting) return
    setIsRepainting(true)
    setProgress(0)
    setProgressMsg('Creating repaint job…')

    try {
      const res = await fetch('/api/jobs/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'REPAINT',
          payload: {
            originalVideoUrl: clip.sourceUrl,
            prompt: newPrompt,
            model: model === 'auto' ? (clip.modelUsed ?? 'kling_standard') : model,
            motionMatch,
            contextClips: surroundingClips.map((c) => c.sourceUrl).filter(Boolean),
          },
        }),
      })

      if (!res.ok) throw new Error('Failed to create repaint job')
      const { jobId } = await res.json() as { jobId: string }

      const sse = new EventSource(`/api/jobs/${jobId}/stream`)
      sse.onmessage = (e) => {
        const data = JSON.parse(e.data) as {
          status: string
          progress?: number
          message?: string
          outputUrl?: string
          error?: string
        }

        setProgress(data.progress ?? 0)
        setProgressMsg(data.message ?? '')

        if (data.status === 'complete' && data.outputUrl) {
          onRepaintComplete(clip.id, data.outputUrl)
          sse.close()
          onClose()
        } else if (data.status === 'failed') {
          setProgressMsg(`Error: ${data.error ?? 'Repaint failed'}`)
          setIsRepainting(false)
          sse.close()
        }
      }
      sse.onerror = () => {
        setProgressMsg('Connection lost')
        setIsRepainting(false)
        sse.close()
      }
    } catch (err) {
      setProgressMsg((err as Error).message)
      setIsRepainting(false)
    }
  }

  const clipDuration = clip.endTime - clip.startTime

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#0e0e1a] rounded-2xl border border-white/12 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-[#00e5c8]" />
            <h2 className="font-semibold text-white/85 text-sm">Repaint Clip</h2>
            <span className="text-xs text-white/30">{clipDuration.toFixed(1)}s</span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/8 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 grid grid-cols-2 gap-5">
          {/* Left: original */}
          <div>
            <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2 font-medium">Original</p>
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              {clip.sourceUrl ? (
                <video src={clip.sourceUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/15 text-xs">No preview</div>
              )}
            </div>
            <p className="text-[10px] text-white/30 mt-2 line-clamp-2 italic">
              {clip.prompt ?? 'No prompt'}
            </p>
          </div>

          {/* Right: new prompt */}
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2 font-medium">New Prompt</p>
              <textarea
                value={newPrompt}
                onChange={(e) => setNewPrompt(e.target.value)}
                placeholder="Describe the changes…"
                className="w-full h-28 bg-[#12121a] border border-white/10 rounded-xl px-3 py-2.5
                  text-sm text-white/80 placeholder:text-white/25 resize-none
                  focus:outline-none focus:border-[#00e5c8]/50 transition-colors"
              />
            </div>

            <div>
              <p className="text-[10px] text-white/35 uppercase tracking-wider mb-2 font-medium">Model</p>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-[#12121a] border border-white/10 rounded-lg px-3 py-2
                  text-xs text-white/70 focus:outline-none focus:border-[#00e5c8]/40"
              >
                {MODELS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <label className="flex items-center gap-2.5 cursor-pointer">
              <div
                onClick={() => setMotionMatch((v) => !v)}
                className={`w-8 h-4 rounded-full transition-colors relative ${motionMatch ? 'bg-[#00e5c8]' : 'bg-white/15'}`}
              >
                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${motionMatch ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              <span className="text-xs text-white/50">Match camera motion</span>
            </label>
          </div>
        </div>

        {/* Context clips strip */}
        {surroundingClips.length > 0 && (
          <div className="px-5 pb-3">
            <p className="text-[10px] text-white/25 mb-2">Context clips</p>
            <div className="flex gap-2">
              {surroundingClips.slice(0, 4).map((c) => (
                <div key={c.id} className="w-16 aspect-video bg-black/50 rounded-lg overflow-hidden border border-white/8">
                  {c.sourceUrl && <video src={c.sourceUrl} className="w-full h-full object-cover" muted />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Progress bar */}
        {isRepainting && (
          <div className="px-5 pb-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] text-white/40">{progressMsg}</span>
              <span className="text-[10px] text-[#00e5c8]">{progress}%</span>
            </div>
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00e5c8] rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/8">
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 text-sm hover:border-white/25 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleRepaint}
            disabled={!newPrompt.trim() || isRepainting}
            className="px-5 py-2 rounded-xl bg-[#00e5c8] hover:bg-[#00f0d5] text-black font-semibold text-sm
              disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isRepainting ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {isRepainting ? 'Repainting…' : 'Repaint'}
          </button>
        </div>
      </div>
    </div>
  )
}
