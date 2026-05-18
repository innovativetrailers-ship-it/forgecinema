'use client'

import { MousePointer2, Scissors, RefreshCw, Type, Users, MapPin, Music, Sparkles, Settings } from 'lucide-react'
import { ICON_BAR_WIDTH } from './constants'

export type ToolId = 'select' | 'razor' | 'repaint' | 'text' | 'characters' | 'location' | 'audio' | 'fx' | 'settings'
export type PanelTab = 'generate' | 'vault' | 'library' | 'location' | 'transitions'

const TOOLS: Array<{ id: ToolId; icon: React.ReactNode; label: string; panelTab?: PanelTab }> = [
  { id: 'select', icon: <MousePointer2 className="w-4.5 h-4.5" />, label: 'Select (V)' },
  { id: 'razor', icon: <Scissors className="w-4.5 h-4.5" />, label: 'Razor (B)' },
  { id: 'repaint', icon: <RefreshCw className="w-4.5 h-4.5" />, label: 'Repaint (R)', panelTab: 'generate' },
  { id: 'text', icon: <Type className="w-4.5 h-4.5" />, label: 'Text (T)' },
  { id: 'characters', icon: <Users className="w-4.5 h-4.5" />, label: 'Characters', panelTab: 'vault' },
  { id: 'location', icon: <MapPin className="w-4.5 h-4.5" />, label: 'Location', panelTab: 'location' },
  { id: 'audio', icon: <Music className="w-4.5 h-4.5" />, label: 'Audio', panelTab: 'library' },
  { id: 'fx', icon: <Sparkles className="w-4.5 h-4.5" />, label: 'FX', panelTab: 'transitions' },
  { id: 'settings', icon: <Settings className="w-4.5 h-4.5" />, label: 'Settings' },
]

interface Props {
  activeTool: ToolId
  activePanel: PanelTab | null
  onToolSelect: (tool: ToolId, panel?: PanelTab) => void
}

export function LeftIconBar({ activeTool, activePanel, onToolSelect }: Props) {
  return (
    <div
      className="flex flex-col items-center py-3 gap-1 border-r border-white/8 bg-[#0c0c14]"
      style={{ width: ICON_BAR_WIDTH }}
    >
      {TOOLS.map((tool) => {
        const isActive = activeTool === tool.id || activePanel === tool.panelTab
        return (
          <button
            key={tool.id}
            title={tool.label}
            onClick={() => onToolSelect(tool.id, tool.panelTab)}
            className={`
              w-9 h-9 rounded-xl flex items-center justify-center
              transition-all duration-150 relative group
              ${isActive
                ? 'bg-[#00e5c8]/20 text-[#00e5c8] shadow-sm shadow-[#00e5c8]/15'
                : 'text-white/30 hover:text-white/70 hover:bg-white/8'}
            `}
          >
            {tool.icon}
            {/* Tooltip */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a2e] border border-white/10
              text-xs text-white/80 rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100
              pointer-events-none transition-opacity z-50">
              {tool.label}
            </div>
          </button>
        )
      })}
    </div>
  )
}
