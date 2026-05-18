'use client'

import { useRef, useState, useCallback, useEffect } from 'react'

export interface MotionBrushRegion {
  id: string
  maskDataUrl: string
  motion: 'move' | 'static' | 'attract' | 'repel'
  direction?: { x: number; y: number }
  speed: number
  label: string
}

interface MotionBrushProps {
  videoPreviewUrl?: string
  width: number
  height: number
  onRegionsChange: (regions: MotionBrushRegion[]) => void
}

const MOTION_COLORS: Record<MotionBrushRegion['motion'], string> = {
  move: 'rgba(251, 191, 36, 0.5)',
  static: 'rgba(59, 130, 246, 0.5)',
  attract: 'rgba(16, 185, 129, 0.5)',
  repel: 'rgba(239, 68, 68, 0.5)',
}

export default function MotionBrush({ videoPreviewUrl, width, height, onRegionsChange }: MotionBrushProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [regions, setRegions] = useState<MotionBrushRegion[]>([])
  const [activeMotion, setActiveMotion] = useState<MotionBrushRegion['motion']>('move')
  const [brushSize, setBrushSize] = useState(30)
  const [isDrawing, setIsDrawing] = useState(false)
  const [activeRegionId, setActiveRegionId] = useState<string | null>(null)
  const [erasing, setErasing] = useState(false)

  // Start a new region on mouse down
  const startRegion = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    if (erasing) {
      // Erase existing strokes at position (simplified — erase whole region for now)
      return
    }

    const { nanoid } = require('nanoid') as { nanoid: () => string }
    const newId = nanoid()

    // Create an off-screen canvas for the mask
    const maskCanvas = document.createElement('canvas')
    maskCanvas.width = width
    maskCanvas.height = height
    const maskCtx = maskCanvas.getContext('2d')!
    maskCtx.fillStyle = MOTION_COLORS[activeMotion]
    maskCtx.beginPath()
    maskCtx.arc(x * (width / canvas.offsetWidth), y * (height / canvas.offsetHeight), brushSize, 0, Math.PI * 2)
    maskCtx.fill()

    const newRegion: MotionBrushRegion = {
      id: newId,
      maskDataUrl: maskCanvas.toDataURL(),
      motion: activeMotion,
      direction: { x: 1, y: 0 },
      speed: 0.5,
      label: `${activeMotion} region`,
    }

    setActiveRegionId(newId)
    setRegions((prev) => {
      const updated = [...prev, newRegion]
      onRegionsChange(updated)
      return updated
    })
    setIsDrawing(true)
  }, [activeMotion, brushSize, erasing, width, height, onRegionsChange])

  const drawOnRegion = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !activeRegionId) return
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setRegions((prev) => {
      const updated = prev.map((r) => {
        if (r.id !== activeRegionId) return r
        const img = new Image()
        img.src = r.maskDataUrl
        const maskCanvas = document.createElement('canvas')
        maskCanvas.width = width
        maskCanvas.height = height
        const ctx = maskCanvas.getContext('2d')!
        ctx.drawImage(img, 0, 0)
        ctx.fillStyle = MOTION_COLORS[r.motion]
        ctx.beginPath()
        ctx.arc(x * (width / canvas.offsetWidth), y * (height / canvas.offsetHeight), brushSize, 0, Math.PI * 2)
        ctx.fill()
        return { ...r, maskDataUrl: maskCanvas.toDataURL() }
      })
      onRegionsChange(updated)
      return updated
    })
  }, [isDrawing, activeRegionId, brushSize, width, height, onRegionsChange])

  // Draw composite regions on visible canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (const region of regions) {
      const img = new Image()
      img.onload = () => {
        ctx.globalAlpha = 0.6
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        ctx.globalAlpha = 1
      }
      img.src = region.maskDataUrl
    }
  }, [regions])

  function removeRegion(id: string) {
    setRegions((prev) => {
      const updated = prev.filter((r) => r.id !== id)
      onRegionsChange(updated)
      return updated
    })
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-2">
          {(['move', 'static', 'attract', 'repel'] as const).map((m) => (
            <button
              key={m}
              onClick={() => setActiveMotion(m)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                activeMotion === m ? 'text-black' : 'text-white bg-white/10 hover:bg-white/20'
              }`}
              style={activeMotion === m ? { backgroundColor: MOTION_COLORS[m].replace('0.5', '1') } : {}}
            >
              {m}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-gray-400">
          Brush
          <input
            type="range"
            min={5}
            max={100}
            value={brushSize}
            onChange={(e) => setBrushSize(Number(e.target.value))}
            className="w-20 accent-[#00e5c8]"
          />
          <span>{brushSize}px</span>
        </label>
        <button
          onClick={() => setErasing((e) => !e)}
          className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${erasing ? 'bg-red-600 text-white' : 'bg-white/10 text-white hover:bg-white/20'}`}
        >
          Eraser
        </button>
        <button
          onClick={() => { setRegions([]); onRegionsChange([]) }}
          className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl overflow-hidden bg-black" style={{ width, height }}>
        {videoPreviewUrl && (
          <img src={videoPreviewUrl} alt="Video frame" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="absolute inset-0 w-full h-full cursor-crosshair"
          onMouseDown={startRegion}
          onMouseMove={drawOnRegion}
          onMouseUp={() => setIsDrawing(false)}
          onMouseLeave={() => setIsDrawing(false)}
        />
      </div>

      {/* Region list */}
      {regions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-gray-400 font-medium">Regions ({regions.length})</div>
          {regions.map((r) => (
            <div key={r.id} className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-2">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: MOTION_COLORS[r.motion].replace('0.5', '1') }}
              />
              <span className="text-xs text-white capitalize flex-1">{r.label}</span>
              {r.motion === 'move' && (
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  Speed
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.1}
                    value={r.speed}
                    onChange={(e) => {
                      setRegions((prev) => {
                        const updated = prev.map((reg) => reg.id === r.id ? { ...reg, speed: Number(e.target.value) } : reg)
                        onRegionsChange(updated)
                        return updated
                      })
                    }}
                    className="w-16 accent-[#00e5c8]"
                  />
                </label>
              )}
              <button
                onClick={() => removeRegion(r.id)}
                className="text-red-400 hover:text-red-300 text-xs"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
