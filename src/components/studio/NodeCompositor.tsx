'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { nanoid } from 'nanoid'

export type NodeType =
  // ── Original nodes ──────────────────────────────────────────────────────
  | 'MediaIn'
  | 'MediaOut'
  | 'Merge'
  | 'Transform'
  | 'ColorCorrect'
  | 'Blur'
  | 'Keyer'
  | 'Mask'
  | 'Tracker'
  | 'DepthMap'
  | 'LUT'
  | 'Grain'
  | 'Glow'
  | 'Defocus'
  | 'Text3D'
  | 'Particle'
  | 'Background'
  | 'TimeOffset'
  // ── Colour nodes ────────────────────────────────────────────────────────
  | 'Grade'
  | 'LUTNode'
  | 'Saturation'
  | 'Invert'
  | 'Clamp'
  // ── Filter nodes ────────────────────────────────────────────────────────
  | 'Sharpen'
  | 'ChromaticAberration'
  | 'FilmGrain'
  | 'MotionBlur'
  // ── Composite nodes ─────────────────────────────────────────────────────
  | 'LayerMerge'
  | 'Switch'
  | 'Dissolve'
  | 'Premult'
  // ── Matte nodes ─────────────────────────────────────────────────────────
  | 'LumaKeyer'
  | 'DifferenceKey'
  | 'SpillSuppress'
  | 'Roto'
  // ── Transform nodes ─────────────────────────────────────────────────────
  | 'Crop'
  | 'Flip'
  | 'Reformat'
  // ── Tracking nodes ──────────────────────────────────────────────────────
  | 'Tracker2D'
  | 'PlanarTracker'
  | 'CornerPin'
  // ── Deep compositing ────────────────────────────────────────────────────
  | 'DeepMerge'
  | 'DeepHold'
  | 'Cryptomatte'
  // ── Utility nodes ───────────────────────────────────────────────────────
  | 'Dot'
  | 'NoOp'
  | 'Shuffle'
  | 'MixChannels'
  | 'Expression'

export interface NodePort {
  id: string
  label: string
  type: 'input' | 'output'
  dataType: 'video' | 'mask' | 'depth' | 'value'
  connected?: boolean
}

export interface CompositorNode {
  id: string
  type: NodeType
  position: { x: number; y: number }
  inputs: NodePort[]
  outputs: NodePort[]
  params: Record<string, unknown>
  label: string
}

export interface NodeConnection {
  id: string
  fromNodeId: string
  fromPortId: string
  toNodeId: string
  toPortId: string
}

const NODE_COLORS: Record<NodeType, string> = {
  // Original
  MediaIn: '#1d4ed8',
  MediaOut: '#065f46',
  Merge: '#7c3aed',
  Transform: '#0369a1',
  ColorCorrect: '#b45309',
  Blur: '#4c1d95',
  Keyer: '#166534',
  Mask: '#713f12',
  Tracker: '#1e3a5f',
  DepthMap: '#374151',
  LUT: '#7f1d1d',
  Grain: '#3f3f46',
  Glow: '#fef3c7',
  Defocus: '#312e81',
  Text3D: '#134e4a',
  Particle: '#431407',
  Background: '#1c1917',
  TimeOffset: '#18181b',
  // Colour
  Grade: '#92400e',
  LUTNode: '#7f1d1d',
  Saturation: '#a16207',
  Invert: '#374151',
  Clamp: '#1f2937',
  // Filter
  Sharpen: '#3730a3',
  ChromaticAberration: '#6b21a8',
  FilmGrain: '#4b5563',
  MotionBlur: '#1e3a5f',
  // Composite
  LayerMerge: '#5b21b6',
  Switch: '#065f46',
  Dissolve: '#86198f',
  Premult: '#1e40af',
  // Matte
  LumaKeyer: '#14532d',
  DifferenceKey: '#1a2e05',
  SpillSuppress: '#1c3324',
  Roto: '#422006',
  // Transform
  Crop: '#0c4a6e',
  Flip: '#0e7490',
  Reformat: '#155e75',
  // Tracking
  Tracker2D: '#1e3a5f',
  PlanarTracker: '#1c3358',
  CornerPin: '#172554',
  // Deep comp
  DeepMerge: '#4c1d95',
  DeepHold: '#3b0764',
  Cryptomatte: '#581c87',
  // Utility
  Dot: '#27272a',
  NoOp: '#18181b',
  Shuffle: '#292524',
  MixChannels: '#1c1917',
  Expression: '#0c0a09',
}

const DEFAULT_PARAMS: Partial<Record<NodeType, Record<string, unknown>>> = {
  Blur: { radius: 5, type: 'gaussian' },
  ColorCorrect: { lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], saturation: 1 },
  Merge: { blendMode: 'normal', opacity: 1.0 },
  Transform: { x: 0, y: 0, scale: 1, rotation: 0 },
  Glow: { threshold: 0.7, intensity: 0.5, radius: 20 },
  Grain: { intensity: 0.3, size: 1.5 },
  LUT: { url: '', intensity: 1.0 },
  TimeOffset: { frames: 0 },
  // New nodes
  Grade: { lift: [0, 0, 0], gamma: [1, 1, 1], gain: [1, 1, 1], offset: [0, 0, 0], contrast: 1 },
  LUTNode: { url: '', intensity: 1.0, format: '.cube' },
  Saturation: { saturation: 1.0, vibrance: 0 },
  Invert: { channels: 'rgb' },
  Clamp: { min: 0, max: 1, channels: 'rgba' },
  Sharpen: { amount: 0.5, radius: 1, threshold: 0 },
  ChromaticAberration: { redOffset: 2, blueOffset: -2, type: 'radial' },
  FilmGrain: { intensity: 0.25, size: 1.0, monochrome: false },
  MotionBlur: { samples: 8, shutterAngle: 180 },
  LayerMerge: { blendMode: 'normal', opacity: 1.0 },
  Switch: { input: 0 },
  Dissolve: { mix: 0.5 },
  Premult: { operation: 'premultiply' },
  LumaKeyer: { low: 0.0, high: 0.2, rollOff: 0.05 },
  DifferenceKey: { threshold: 0.1, rollOff: 0.05 },
  SpillSuppress: { colour: 'green', amount: 1.0 },
  Roto: { feather: 2, invert: false, paths: [] },
  Crop: { left: 0, right: 0, top: 0, bottom: 0 },
  Flip: { horizontal: false, vertical: false },
  Reformat: { width: 1920, height: 1080, fitType: 'letterbox' },
  Tracker2D: { searchRadius: 20, trackType: 'translation' },
  PlanarTracker: { searchRadius: 40, motionType: 'homography' },
  CornerPin: { topLeft: [0, 0], topRight: [1920, 0], bottomLeft: [0, 1080], bottomRight: [1920, 1080] },
  DeepMerge: { operation: 'over' },
  DeepHold: { threshold: 0.5 },
  Cryptomatte: { matteName: '', level: 6 },
  Dot: {},
  NoOp: {},
  Shuffle: { r: 'r', g: 'g', b: 'b', a: 'a' },
  MixChannels: { blend: 0.5 },
  Expression: { expr: 'r' },
}

const NODE_PORTS: Partial<Record<NodeType, { inputs: Omit<NodePort, 'id'>[]; outputs: Omit<NodePort, 'id'>[] }>> = {
  MediaIn: { inputs: [], outputs: [{ label: 'Output', type: 'output', dataType: 'video' }] },
  MediaOut: { inputs: [{ label: 'Input', type: 'input', dataType: 'video' }], outputs: [] },
  Merge: {
    inputs: [
      { label: 'Foreground', type: 'input', dataType: 'video' },
      { label: 'Background', type: 'input', dataType: 'video' },
      { label: 'Mask', type: 'input', dataType: 'mask' },
    ],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Blur: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  ColorCorrect: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Keyer: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [
      { label: 'Output', type: 'output', dataType: 'video' },
      { label: 'Matte', type: 'output', dataType: 'mask' },
    ],
  },
  Glow: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  LUT: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Transform: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Grain: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  // ── Colour nodes ──────────────────────────────────────────
  Grade: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }, { label: 'Mask', type: 'input', dataType: 'mask' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  LUTNode: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Saturation: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Invert: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Clamp: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  // ── Filter nodes ──────────────────────────────────────────
  Sharpen: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Defocus: {
    inputs: [
      { label: 'Input', type: 'input', dataType: 'video' },
      { label: 'Depth', type: 'input', dataType: 'depth' },
    ],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  ChromaticAberration: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  FilmGrain: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  MotionBlur: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  // ── Composite nodes ───────────────────────────────────────
  LayerMerge: {
    inputs: [
      { label: 'Foreground', type: 'input', dataType: 'video' },
      { label: 'Background', type: 'input', dataType: 'video' },
      { label: 'Mask', type: 'input', dataType: 'mask' },
    ],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Switch: {
    inputs: [
      { label: 'Input A', type: 'input', dataType: 'video' },
      { label: 'Input B', type: 'input', dataType: 'video' },
    ],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Dissolve: {
    inputs: [
      { label: 'From', type: 'input', dataType: 'video' },
      { label: 'To', type: 'input', dataType: 'video' },
    ],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Premult: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  // ── Matte nodes ───────────────────────────────────────────
  LumaKeyer: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [
      { label: 'Output', type: 'output', dataType: 'video' },
      { label: 'Matte', type: 'output', dataType: 'mask' },
    ],
  },
  DifferenceKey: {
    inputs: [
      { label: 'Foreground', type: 'input', dataType: 'video' },
      { label: 'Background', type: 'input', dataType: 'video' },
    ],
    outputs: [
      { label: 'Output', type: 'output', dataType: 'video' },
      { label: 'Matte', type: 'output', dataType: 'mask' },
    ],
  },
  SpillSuppress: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Roto: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [
      { label: 'Output', type: 'output', dataType: 'video' },
      { label: 'Mask', type: 'output', dataType: 'mask' },
    ],
  },
  // ── Transform nodes ───────────────────────────────────────
  Crop: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Flip: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Reformat: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  // ── Tracking nodes ────────────────────────────────────────
  Tracker2D: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [
      { label: 'Output', type: 'output', dataType: 'video' },
      { label: 'Track Data', type: 'output', dataType: 'value' },
    ],
  },
  PlanarTracker: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [
      { label: 'Output', type: 'output', dataType: 'video' },
      { label: 'Transform', type: 'output', dataType: 'value' },
    ],
  },
  CornerPin: {
    inputs: [
      { label: 'Input', type: 'input', dataType: 'video' },
      { label: 'Track Data', type: 'input', dataType: 'value' },
    ],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  // ── Deep compositing ──────────────────────────────────────
  DeepMerge: {
    inputs: [
      { label: 'Deep A', type: 'input', dataType: 'depth' },
      { label: 'Deep B', type: 'input', dataType: 'depth' },
    ],
    outputs: [
      { label: 'Deep', type: 'output', dataType: 'depth' },
      { label: 'Flat', type: 'output', dataType: 'video' },
    ],
  },
  DeepHold: {
    inputs: [
      { label: 'Deep', type: 'input', dataType: 'depth' },
      { label: 'Mask', type: 'input', dataType: 'mask' },
    ],
    outputs: [{ label: 'Deep', type: 'output', dataType: 'depth' }],
  },
  Cryptomatte: {
    inputs: [{ label: 'EXR', type: 'input', dataType: 'depth' }],
    outputs: [
      { label: 'Matte', type: 'output', dataType: 'mask' },
      { label: 'Preview', type: 'output', dataType: 'video' },
    ],
  },
  DepthMap: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [
      { label: 'Depth', type: 'output', dataType: 'depth' },
      { label: 'Preview', type: 'output', dataType: 'video' },
    ],
  },
  // ── Utility nodes ─────────────────────────────────────────
  Dot: {
    inputs: [{ label: '', type: 'input', dataType: 'video' }],
    outputs: [{ label: '', type: 'output', dataType: 'video' }],
  },
  NoOp: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Shuffle: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  MixChannels: {
    inputs: [
      { label: 'Input A', type: 'input', dataType: 'video' },
      { label: 'Input B', type: 'input', dataType: 'video' },
    ],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  Expression: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
  TimeOffset: {
    inputs: [{ label: 'Input', type: 'input', dataType: 'video' }],
    outputs: [{ label: 'Output', type: 'output', dataType: 'video' }],
  },
}

function makeNode(type: NodeType, position: { x: number; y: number }): CompositorNode {
  const portDef = NODE_PORTS[type] ?? { inputs: [{ label: 'Input', type: 'input', dataType: 'video' }], outputs: [{ label: 'Output', type: 'output', dataType: 'video' }] }
  return {
    id: nanoid(),
    type,
    position,
    inputs: portDef.inputs.map((p) => ({ ...p, id: nanoid() } as NodePort)),
    outputs: portDef.outputs.map((p) => ({ ...p, id: nanoid() } as NodePort)),
    params: { ...(DEFAULT_PARAMS[type] ?? {}) },
    label: type,
  }
}

const NODE_TYPES_LIST: NodeType[] = [
  // I/O
  'MediaIn', 'MediaOut',
  // Colour
  'ColorCorrect', 'Grade', 'LUTNode', 'LUT', 'Saturation', 'Invert', 'Clamp',
  // Filter
  'Blur', 'Sharpen', 'Defocus', 'Glow', 'ChromaticAberration', 'FilmGrain', 'MotionBlur', 'Grain',
  // Composite
  'Merge', 'LayerMerge', 'Switch', 'Dissolve', 'Premult',
  // Matte
  'Keyer', 'LumaKeyer', 'DifferenceKey', 'SpillSuppress', 'Roto', 'Mask',
  // Transform
  'Transform', 'Crop', 'Flip', 'Reformat',
  // Tracking
  'Tracker', 'Tracker2D', 'PlanarTracker', 'CornerPin',
  // Deep comp
  'DeepMerge', 'DeepHold', 'Cryptomatte', 'DepthMap',
  // Effects
  'Text3D', 'Particle', 'Background',
  // Utility
  'TimeOffset', 'Dot', 'NoOp', 'Shuffle', 'MixChannels', 'Expression',
]

export default function NodeCompositor() {
  const [nodes, setNodes] = useState<CompositorNode[]>([])
  const [connections, setConnections] = useState<NodeConnection[]>([])
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [dragging, setDragging] = useState<{ nodeId: string; offsetX: number; offsetY: number } | null>(null)
  const [connecting, setConnecting] = useState<{ fromNodeId: string; fromPortId: string } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  function addNode(type: NodeType) {
    const node = makeNode(type, { x: 200 + Math.random() * 300, y: 100 + Math.random() * 200 })
    setNodes((prev) => [...prev, node])
  }

  function deleteNode(id: string) {
    setNodes((prev) => prev.filter((n) => n.id !== id))
    setConnections((prev) => prev.filter((c) => c.fromNodeId !== id && c.toNodeId !== id))
    if (selectedNode === id) setSelectedNode(null)
  }

  function startDrag(e: React.MouseEvent, nodeId: string) {
    e.stopPropagation()
    const node = nodes.find((n) => n.id === nodeId)
    if (!node) return
    const rect = (e.target as HTMLElement).closest('[data-node]')?.getBoundingClientRect()
    if (!rect) return
    setDragging({ nodeId, offsetX: e.clientX - node.position.x, offsetY: e.clientY - node.position.y })
    setSelectedNode(nodeId)
  }

  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    const containerRect = containerRef.current?.getBoundingClientRect()
    if (!containerRect) return
    setNodes((prev) =>
      prev.map((n) =>
        n.id === dragging.nodeId
          ? { ...n, position: { x: e.clientX - dragging.offsetX, y: e.clientY - dragging.offsetY } }
          : n
      )
    )
  }

  function startConnect(e: React.MouseEvent, nodeId: string, portId: string) {
    e.stopPropagation()
    setConnecting({ fromNodeId: nodeId, fromPortId: portId })
  }

  function endConnect(e: React.MouseEvent, toNodeId: string, toPortId: string) {
    e.stopPropagation()
    if (!connecting || connecting.fromNodeId === toNodeId) {
      setConnecting(null)
      return
    }
    const conn: NodeConnection = {
      id: nanoid(),
      fromNodeId: connecting.fromNodeId,
      fromPortId: connecting.fromPortId,
      toNodeId,
      toPortId,
    }
    setConnections((prev) => [...prev, conn])
    setConnecting(null)
  }

  const selectedNodeData = nodes.find((n) => n.id === selectedNode)

  return (
    <div className="flex h-full bg-[#0c0c10] text-white overflow-hidden">
      {/* Node palette */}
      <div className="w-48 flex-shrink-0 border-r border-white/10 overflow-y-auto p-3">
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Nodes</div>
        {NODE_TYPES_LIST.map((type) => (
          <button
            key={type}
            onClick={() => addNode(type)}
            className="w-full text-left px-2 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-colors mb-1 flex items-center gap-2"
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: NODE_COLORS[type] }} />
            {type}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        onMouseMove={onMouseMove}
        onMouseUp={() => setDragging(null)}
        onClick={() => setConnecting(null)}
      >
        {/* Connection SVG */}
        <svg ref={svgRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 1 }}>
          {connections.map((conn) => {
            const fromNode = nodes.find((n) => n.id === conn.fromNodeId)
            const toNode = nodes.find((n) => n.id === conn.toNodeId)
            if (!fromNode || !toNode) return null
            const x1 = fromNode.position.x + 180
            const y1 = fromNode.position.y + 30
            const x2 = toNode.position.x
            const y2 = toNode.position.y + 30
            const cp = Math.abs(x2 - x1) * 0.5
            return (
              <path
                key={conn.id}
                d={`M ${x1} ${y1} C ${x1 + cp} ${y1}, ${x2 - cp} ${y2}, ${x2} ${y2}`}
                stroke="#00e5c8"
                strokeWidth={2}
                fill="none"
                opacity={0.7}
              />
            )
          })}
        </svg>

        {/* Nodes */}
        {nodes.map((node) => (
          <div
            key={node.id}
            data-node={node.id}
            className={`absolute bg-[#1a1a24] rounded-xl border transition-all select-none ${
              selectedNode === node.id ? 'border-[#00b8a0]' : 'border-white/10'
            }`}
            style={{ left: node.position.x, top: node.position.y, width: 180, zIndex: 2 }}
            onMouseDown={(e) => startDrag(e, node.id)}
          >
            {/* Header */}
            <div
              className="px-3 py-2 rounded-t-xl flex items-center justify-between text-xs font-semibold"
              style={{ backgroundColor: NODE_COLORS[node.type] + '33' }}
            >
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: NODE_COLORS[node.type] }} />
                {node.label}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); deleteNode(node.id) }}
                className="text-gray-500 hover:text-red-400 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Ports */}
            <div className="py-2 px-0 relative">
              {/* Inputs */}
              {node.inputs.map((port) => (
                <div
                  key={port.id}
                  className="flex items-center gap-2 px-2 py-0.5"
                  onMouseUp={(e) => endConnect(e, node.id, port.id)}
                >
                  <div
                    className="w-3 h-3 rounded-full border-2 border-white/40 cursor-crosshair -ml-1.5 flex-shrink-0 hover:border-[#00b8a0] transition-colors"
                    style={{ backgroundColor: '#1a1a24' }}
                  />
                  <span className="text-xs text-gray-400">{port.label}</span>
                </div>
              ))}
              {/* Outputs */}
              {node.outputs.map((port) => (
                <div
                  key={port.id}
                  className="flex items-center justify-end gap-2 px-2 py-0.5"
                  onMouseDown={(e) => startConnect(e, node.id, port.id)}
                >
                  <span className="text-xs text-gray-400">{port.label}</span>
                  <div
                    className="w-3 h-3 rounded-full border-2 border-[#00b8a0] cursor-crosshair -mr-1.5 flex-shrink-0 hover:bg-[#00f0d5] transition-colors"
                    style={{ backgroundColor: '#1a1a24' }}
                  />
                </div>
              ))}
            </div>
          </div>
        ))}

        {nodes.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm pointer-events-none">
            Add nodes from the panel to start compositing
          </div>
        )}
      </div>

      {/* Inspector panel */}
      {selectedNodeData && (
        <div className="w-56 flex-shrink-0 border-l border-white/10 p-4 overflow-y-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{selectedNodeData.type}</div>
          {Object.entries(selectedNodeData.params).map(([key, value]) => (
            <div key={key} className="mb-3">
              <label className="text-xs text-gray-400 block mb-1 capitalize">{key.replace(/_/g, ' ')}</label>
              {typeof value === 'number' ? (
                <input
                  type="number"
                  value={value}
                  step={0.01}
                  onChange={(e) => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNodeData.id
                          ? { ...n, params: { ...n.params, [key]: Number(e.target.value) } }
                          : n
                      )
                    )
                  }}
                  className="w-full bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-teal-400"
                />
              ) : typeof value === 'string' ? (
                <input
                  type="text"
                  value={value}
                  onChange={(e) => {
                    setNodes((prev) =>
                      prev.map((n) =>
                        n.id === selectedNodeData.id
                          ? { ...n, params: { ...n.params, [key]: e.target.value } }
                          : n
                      )
                    )
                  }}
                  className="w-full bg-white/10 rounded-lg px-2 py-1 text-xs text-white outline-none focus:ring-1 focus:ring-teal-400"
                />
              ) : (
                <pre className="text-xs text-gray-500">{JSON.stringify(value)}</pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
