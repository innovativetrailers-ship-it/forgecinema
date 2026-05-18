'use client'

import { useState } from 'react'
import { Loader2, RefreshCw, ChevronDown, Film, Clock, Users } from 'lucide-react'
import type { ScriptScene } from './ScriptEditor'

export interface StoryboardShot {
  id: string
  sceneId: string
  shotNumber: number
  shotType: string    // 'WS' | 'MS' | 'CU' | 'ECU' | 'OS' | 'POV'
  cameraAngle: string
  action: string
  dialogue?: string
  characters: string[]
  estimatedDuration: number
  frameImageUrl?: string
  generatedVideoUrl?: string
  model?: string
  status: 'pending' | 'generating_frame' | 'frame_ready' | 'generating_video' | 'complete' | 'failed'
  notes?: string
}

interface Props {
  scenes: ScriptScene[]
  shots: StoryboardShot[]
  onShotUpdate: (shotId: string, updates: Partial<StoryboardShot>) => void
  onRegenerateFrame: (shotId: string) => void
  onGenerateVideo: (shotId: string) => void
  onAddToTimeline: (shot: StoryboardShot) => void
}

const SHOT_TYPE_COLOURS: Record<string, string> = {
  WS: 'bg-blue-500/20 text-blue-400',
  MS: 'bg-purple-500/20 text-purple-400',
  CU: 'bg-[#00e5c8]/20 text-[#00e5c8]',
  ECU: 'bg-red-500/20 text-red-400',
  OS: 'bg-green-500/20 text-green-400',
  POV: 'bg-cyan-500/20 text-cyan-400',
}

const SHOT_TYPES = ['WS', 'MS', 'CU', 'ECU', 'OS', 'POV']
const CAMERA_ANGLES = ['Eye Level', 'Low Angle', 'High Angle', 'Dutch Angle', 'Bird\'s Eye', 'Worm\'s Eye']

function ShotCard({ shot, onUpdate, onRegenerateFrame, onGenerateVideo, onAddToTimeline }: {
  shot: StoryboardShot
  onUpdate: (updates: Partial<StoryboardShot>) => void
  onRegenerateFrame: () => void
  onGenerateVideo: () => void
  onAddToTimeline: () => void
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isGenerating = shot.status === 'generating_frame' || shot.status === 'generating_video'

  return (
    <div className={`rounded-xl border transition-all duration-200 overflow-hidden
      ${shot.status === 'complete' ? 'border-green-500/30 bg-green-500/5' : 'border-white/8 bg-white/3'}
      hover:border-white/20`}
    >
      {/* Shot header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/6">
        <span className="font-mono text-[10px] text-white/30">#{shot.shotNumber}</span>
        <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${SHOT_TYPE_COLOURS[shot.shotType] ?? 'bg-white/10 text-white/40'}`}>
          {shot.shotType}
        </div>
        <span className="text-[10px] text-white/40 truncate flex-1">{shot.cameraAngle}</span>
        <div className="flex items-center gap-1 text-[9px] text-white/25">
          <Clock className="w-2.5 h-2.5" />
          {shot.estimatedDuration}s
        </div>
        <button onClick={() => setIsExpanded((v) => !v)} className="text-white/20 hover:text-white/50 transition-colors">
          <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Frame preview */}
      <div className="relative">
        <div className="aspect-video bg-[#050508] flex items-center justify-center relative overflow-hidden">
          {shot.frameImageUrl ? (
            <img src={shot.frameImageUrl} alt={`Shot ${shot.shotNumber}`} className="w-full h-full object-cover" />
          ) : shot.generatedVideoUrl ? (
            <video src={shot.generatedVideoUrl} className="w-full h-full object-cover" muted autoPlay loop playsInline />
          ) : isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-white/30">
              <Loader2 className="w-5 h-5 animate-spin text-[#00e5c8]" />
              <span className="text-[10px]">
                {shot.status === 'generating_frame' ? 'Generating frame…' : 'Generating video…'}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-1.5 text-white/20">
              <Film className="w-5 h-5" />
              <span className="text-[10px]">No frame yet</span>
            </div>
          )}

          {/* Shot type badge overlay */}
          <div className="absolute top-1.5 left-1.5">
            <div className={`px-1.5 py-0.5 rounded text-[9px] font-bold backdrop-blur-sm ${SHOT_TYPE_COLOURS[shot.shotType] ?? 'bg-black/60 text-white/60'}`}>
              {shot.shotType}
            </div>
          </div>

          {/* Complete badge */}
          {shot.status === 'complete' && (
            <div className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-green-500 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">✓</span>
            </div>
          )}
        </div>
      </div>

      {/* Action description */}
      <div className="px-3 py-2">
        <p className="text-[10px] text-white/50 leading-relaxed line-clamp-2">{shot.action}</p>
        {shot.dialogue && (
          <p className="text-[9px] text-cyan-400/60 italic mt-1 line-clamp-1">"{shot.dialogue}"</p>
        )}
        {shot.characters.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5">
            <Users className="w-2.5 h-2.5 text-white/20" />
            <span className="text-[9px] text-white/25">{shot.characters.join(', ')}</span>
          </div>
        )}
      </div>

      {/* Expanded editor */}
      {isExpanded && (
        <div className="border-t border-white/6 px-3 py-2.5 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-[9px] text-white/30 mb-1">Shot Type</p>
              <div className="flex flex-wrap gap-1">
                {SHOT_TYPES.map((t) => (
                  <button
                    key={t}
                    onClick={() => onUpdate({ shotType: t })}
                    className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors
                      ${shot.shotType === t ? SHOT_TYPE_COLOURS[t] : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[9px] text-white/30 mb-1">Camera Angle</p>
              <select
                value={shot.cameraAngle}
                onChange={(e) => onUpdate({ cameraAngle: e.target.value })}
                className="w-full bg-[#12121a] border border-white/10 rounded px-1.5 py-1 text-[9px] text-white/60 focus:outline-none"
              >
                {CAMERA_ANGLES.map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </div>
          <div>
            <p className="text-[9px] text-white/30 mb-1">Notes</p>
            <textarea
              value={shot.notes ?? ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              placeholder="Director's notes…"
              className="w-full h-12 bg-[#12121a] border border-white/10 rounded px-2 py-1 text-[10px] text-white/60
                placeholder:text-white/20 resize-none focus:outline-none focus:border-[#00e5c8]/30"
            />
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex border-t border-white/6">
        <button
          onClick={onRegenerateFrame}
          disabled={isGenerating}
          className="flex-1 py-1.5 text-[9px] text-white/30 hover:text-[#00e5c8] hover:bg-[#00e5c8]/8
            transition-colors flex items-center justify-center gap-1 border-r border-white/6"
        >
          <RefreshCw className="w-2.5 h-2.5" /> Frame
        </button>
        <button
          onClick={onGenerateVideo}
          disabled={isGenerating || !shot.frameImageUrl}
          className="flex-1 py-1.5 text-[9px] text-white/30 hover:text-purple-400 hover:bg-purple-500/8
            transition-colors flex items-center justify-center gap-1 border-r border-white/6
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Film className="w-2.5 h-2.5" /> Video
        </button>
        <button
          onClick={onAddToTimeline}
          disabled={!shot.generatedVideoUrl}
          className="flex-1 py-1.5 text-[9px] text-white/30 hover:text-green-400 hover:bg-green-500/8
            transition-colors flex items-center justify-center gap-1
            disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Timeline
        </button>
      </div>
    </div>
  )
}

export function StoryboardViewer({ scenes, shots, onShotUpdate, onRegenerateFrame, onGenerateVideo, onAddToTimeline }: Props) {
  const [filterScene, setFilterScene] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'strip'>('grid')

  const visible = filterScene === 'all' ? shots : shots.filter((s) => s.sceneId === filterScene)

  return (
    <div className="flex flex-col h-full bg-[#0a0a12]">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-white/8 flex-shrink-0">
        <Film className="w-3.5 h-3.5 text-purple-400" />
        <span className="text-[11px] font-semibold text-white/50 uppercase tracking-wider">Storyboard</span>
        <div className="flex-1" />

        {/* Scene filter */}
        <select
          value={filterScene}
          onChange={(e) => setFilterScene(e.target.value)}
          className="bg-[#12121a] border border-white/10 rounded-lg px-2 py-1 text-[10px] text-white/50 focus:outline-none"
        >
          <option value="all">All Scenes ({shots.length} shots)</option>
          {scenes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.heading.slice(0, 30)}
            </option>
          ))}
        </select>

        {/* View toggle */}
        <div className="flex border border-white/10 rounded-lg overflow-hidden">
          {(['grid', 'strip'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setViewMode(m)}
              className={`px-2.5 py-1 text-[10px] transition-colors capitalize
                ${viewMode === m ? 'bg-white/10 text-white/70' : 'text-white/30 hover:text-white/50'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Shot count summary */}
      {shots.length > 0 && (
        <div className="flex items-center gap-3 px-3 py-1.5 border-b border-white/6 flex-shrink-0">
          {['pending', 'frame_ready', 'complete'].map((status) => {
            const count = shots.filter((s) => s.status === status).length
            if (!count) return null
            const colours = { pending: 'text-white/30', frame_ready: 'text-[#00e5c8]', complete: 'text-green-400' }
            const labels = { pending: 'Pending', frame_ready: 'Frame ready', complete: 'Complete' }
            return (
              <span key={status} className={`text-[10px] ${colours[status as keyof typeof colours]}`}>
                {count} {labels[status as keyof typeof labels]}
              </span>
            )
          })}
        </div>
      )}

      {/* Shots */}
      <div className="flex-1 overflow-y-auto p-3">
        {visible.length === 0 ? (
          <div className="flex items-center justify-center h-full text-white/20 text-sm flex-col gap-3">
            <Film className="w-10 h-10 text-white/10" />
            <p>Parse your script to generate storyboard shots</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
            {visible.map((shot) => (
              <ShotCard
                key={shot.id}
                shot={shot}
                onUpdate={(u) => onShotUpdate(shot.id, u)}
                onRegenerateFrame={() => onRegenerateFrame(shot.id)}
                onGenerateVideo={() => onGenerateVideo(shot.id)}
                onAddToTimeline={() => onAddToTimeline(shot)}
              />
            ))}
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {visible.map((shot) => (
              <div key={shot.id} className="flex-shrink-0 w-44">
                <ShotCard
                  shot={shot}
                  onUpdate={(u) => onShotUpdate(shot.id, u)}
                  onRegenerateFrame={() => onRegenerateFrame(shot.id)}
                  onGenerateVideo={() => onGenerateVideo(shot.id)}
                  onAddToTimeline={() => onAddToTimeline(shot)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
