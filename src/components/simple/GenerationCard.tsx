'use client'

import { useEffect, useRef, useState } from 'react'
import { Download, RefreshCw, Plus, Play, X, Loader2 } from 'lucide-react'
import type { GeneratedClip } from './types'
import { MODEL_FAMILY_COLOURS } from './types'

interface Props {
  clip: GeneratedClip
  onRegenerate: (clip: GeneratedClip) => void
  onAddToTimeline: (clip: GeneratedClip) => void
  onExpand: (clip: GeneratedClip) => void
}

function ProgressRing({ progress }: { progress: number }) {
  const r = 20
  const circ = 2 * Math.PI * r
  const offset = circ - (progress / 100) * circ

  return (
    <svg width="52" height="52" className="absolute inset-0 m-auto">
      <circle cx="26" cy="26" r={r} fill="none" stroke="#1a1a24" strokeWidth="3" />
      <circle
        cx="26"
        cy="26"
        r={r}
        fill="none"
        stroke="#00e5c8"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform="rotate(-90 26 26)"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  )
}

export function GenerationCard({ clip, onRegenerate, onAddToTimeline, onExpand }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const modelColour = MODEL_FAMILY_COLOURS[clip.model] ?? '#6b7280'

  const isGenerating = clip.status === 'queued' || clip.status === 'processing'
  const isFailed = clip.status === 'failed'
  const isDone = clip.status === 'complete'

  useEffect(() => {
    if (isHovered && videoRef.current && isDone) {
      videoRef.current.play().catch(() => {})
    } else if (!isHovered && videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isHovered, isDone])

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!clip.videoUrl) return
    const a = document.createElement('a')
    a.href = clip.videoUrl
    a.download = `cinema_${clip.jobId}.mp4`
    a.click()
  }

  return (
    <div
      className={`
        group relative rounded-xl overflow-hidden cursor-pointer
        bg-[#12121a] border transition-all duration-200
        ${isDone ? 'border-white/10 hover:border-[#00e5c8]/50 hover:shadow-lg hover:shadow-[#00e5c8]/10' : ''}
        ${isGenerating ? 'border-[#00e5c8]/30 animate-pulse-subtle' : ''}
        ${isFailed ? 'border-red-500/30' : ''}
      `}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => isDone && onExpand(clip)}
    >
      {/* Thumbnail / Video */}
      <div className="relative aspect-video bg-[#0c0c14]">
        {isDone && clip.videoUrl && (
          <video
            ref={videoRef}
            src={clip.videoUrl}
            className="w-full h-full object-cover"
            muted
            loop
            playsInline
            poster={clip.thumbnailUrl}
          />
        )}

        {!isDone && !isFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="relative w-14 h-14">
              <ProgressRing progress={clip.progress ?? 0} />
              <Loader2 className="absolute inset-0 m-auto w-5 h-5 text-[#00e5c8] animate-spin" />
            </div>
            <p className="text-xs text-white/50 text-center px-3">
              {clip.progressMessage ?? 'Generating…'}
            </p>
          </div>
        )}

        {isFailed && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
            <X className="w-8 h-8 text-red-400" />
            <p className="text-xs text-red-400 text-center px-3">{clip.error ?? 'Generation failed'}</p>
          </div>
        )}

        {/* Hover overlay for done clips */}
        {isDone && (
          <div className={`
            absolute inset-0 bg-black/60 flex items-center justify-center
            transition-opacity duration-200
            ${isHovered ? 'opacity-100' : 'opacity-0'}
          `}>
            <Play className="w-12 h-12 text-white" fill="white" />
          </div>
        )}

        {/* Model badge */}
        <div
          className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-medium text-white"
          style={{ backgroundColor: modelColour }}
        >
          {clip.model.replace('_', ' ').toUpperCase()}
        </div>

        {/* Credits badge */}
        <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-[#00e5c8] font-medium">
          ⬡ {clip.creditsUsed}
        </div>
      </div>

      {/* Card footer */}
      <div className="p-3">
        <p className="text-xs text-white/70 line-clamp-2 mb-3 leading-relaxed">
          {clip.prompt}
        </p>

        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onRegenerate(clip) }}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg
              bg-white/5 hover:bg-white/10 text-white/60 hover:text-white text-xs transition-colors"
            title="Regenerate"
          >
            <RefreshCw className="w-3 h-3" />
            Redo
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); onAddToTimeline(clip) }}
            disabled={!isDone}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg
              bg-white/5 hover:bg-[#00e5c8]/20 text-white/60 hover:text-[#00e5c8] text-xs
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Add to timeline"
          >
            <Plus className="w-3 h-3" />
            Timeline
          </button>

          <button
            onClick={handleDownload}
            disabled={!isDone}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white
              disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Download"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
