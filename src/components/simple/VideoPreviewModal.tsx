'use client'

import { useEffect, useRef } from 'react'
import { X, Download, Plus, RefreshCw } from 'lucide-react'
import type { GeneratedClip } from './types'
import { MODEL_FAMILY_COLOURS } from './types'

interface Props {
  clip: GeneratedClip
  onClose: () => void
  onRegenerate: (clip: GeneratedClip) => void
  onAddToTimeline: (clip: GeneratedClip) => void
}

export function VideoPreviewModal({ clip, onClose, onRegenerate, onAddToTimeline }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const modelColour = MODEL_FAMILY_COLOURS[clip.model] ?? '#6b7280'

  useEffect(() => {
    videoRef.current?.play().catch(() => {})
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const handleDownload = async () => {
    if (!clip.videoUrl) return
    const a = document.createElement('a')
    a.href = clip.videoUrl
    a.download = `cinema_${clip.jobId}.mp4`
    a.click()
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-4xl w-full bg-[#0c0c14] rounded-2xl overflow-hidden border border-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Video */}
        <div className="relative bg-black">
          {clip.videoUrl && (
            <video
              ref={videoRef}
              src={clip.videoUrl}
              className="w-full max-h-[70vh] object-contain"
              controls
              loop
              poster={clip.thumbnailUrl}
            />
          )}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info bar */}
        <div className="p-5 flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium text-white"
                style={{ backgroundColor: modelColour }}
              >
                {clip.model.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-xs text-[#00e5c8] font-medium">⬡ {clip.creditsUsed} credits</span>
              <span className="text-xs text-white/40">{clip.duration}s</span>
            </div>
            <p className="text-sm text-white/70 leading-relaxed">{clip.prompt}</p>
          </div>

          <div className="flex gap-2 flex-shrink-0">
            <button
              onClick={() => { onRegenerate(clip); onClose() }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10
                text-white/70 hover:text-white text-sm transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Regenerate
            </button>
            <button
              onClick={() => { onAddToTimeline(clip); onClose() }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#00e5c8]/20 hover:bg-[#00e5c8]/30
                text-[#00e5c8] text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add to Timeline
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10
                text-white/70 hover:text-white text-sm transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
