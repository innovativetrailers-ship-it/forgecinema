export const TRACK_LABEL_WIDTH = 76
export const ICON_BAR_WIDTH = 44
export const LEFT_PANEL_WIDTH = 240
export const RIGHT_PANEL_WIDTH = 240
export const PREVIEW_HEIGHT = 220
export const RULER_HEIGHT = 28
export const TRACK_HEIGHT = 52
export const MIN_ZOOM = 20   // px per second
export const MAX_ZOOM = 400
export const DEFAULT_ZOOM = 80

export const TRACK_COLOURS: Record<string, string> = {
  'VIDEO 1': '#3b82f6',
  'VIDEO 2': '#8b5cf6',
  VFX: '#10b981',
  CGI: '#00e5c8',
  MUSIC: '#ec4899',
  VOICE: '#06b6d4',
  SFX: '#84cc16',
  CAPTIONS: '#94a3b8',
}

export const MODEL_CLIP_COLOURS: Record<string, string> = {
  kling_standard: 'rgba(59,130,246,0.8)',
  kling_pro: 'rgba(37,99,235,0.9)',
  veo3: 'rgba(124,58,237,0.9)',
  seedance: 'rgba(13,148,136,0.85)',
  runway: 'rgba(219,39,119,0.8)',
  luma: 'rgba(234,88,12,0.75)',
  pika: 'rgba(217,119,6,0.75)',
  minimax: 'rgba(5,150,105,0.75)',
  animatediff: 'rgba(107,114,128,0.7)',
  wan: 'rgba(120,113,108,0.7)',
}

export const TRANSITION_PRESETS = [
  { id: 'cut', label: 'Cut', icon: '✂', category: 'Basic', free: true },
  { id: 'dissolve', label: 'Dissolve', icon: '◑', category: 'Basic', free: true },
  { id: 'fade', label: 'Fade', icon: '○', category: 'Basic', free: true },
  { id: 'film_burn', label: 'Film Burn', icon: '◈', category: 'Cinematic', free: false },
  { id: 'wipe', label: 'Wipe', icon: '▷', category: 'Basic', free: true },
  { id: 'zoom', label: 'Zoom', icon: '⊕', category: 'Motion', free: false },
  { id: 'glitch', label: 'Glitch', icon: '⚡', category: 'FX', free: false },
]

export const EFFECT_PRESETS = [
  { id: 'film_grain', label: 'Film Grain', icon: '▒' },
  { id: 'vignette', label: 'Vignette', icon: '◉' },
  { id: 'chromatic_aberration', label: 'Chromatic', icon: '◐' },
  { id: 'bloom', label: 'Bloom', icon: '✦' },
  { id: 'motion_blur', label: 'Motion Blur', icon: '⟶' },
  { id: 'halation', label: 'Halation', icon: '☀' },
  { id: 'fog', label: 'Fog', icon: '≋' },
  { id: 'rain', label: 'Rain', icon: '⏐' },
]
