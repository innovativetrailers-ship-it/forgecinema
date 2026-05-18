export type QualityTier = 'draft' | 'standard' | 'cinematic' | 'film_grade'
export type AspectRatio = '16:9' | '9:16' | '1:1' | '21:9'
export type Duration = 5 | 10 | 15 | 30 | 60 | 'custom'
export type SimpleTab = 'text' | 'image' | 'audio' | 'social'

export interface QualityPill {
  id: QualityTier
  label: string
  credits: number
  model: string
  description: string
}

export const QUALITY_PILLS: QualityPill[] = [
  { id: 'draft', label: 'Quick Draft', credits: 2, model: 'animatediff', description: '~8s • Budget' },
  { id: 'standard', label: 'Standard', credits: 8, model: 'kling_standard', description: '~15s • Quality' },
  { id: 'cinematic', label: 'Cinematic', credits: 25, model: 'kling_pro', description: '~30s • Pro' },
  { id: 'film_grade', label: 'Film Grade', credits: 40, model: 'veo3', description: '~60s • Cinema' },
]

export const DURATION_OPTIONS: Array<{ value: Duration; label: string }> = [
  { value: 5, label: '5s' },
  { value: 10, label: '10s' },
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 60, label: '60s' },
  { value: 'custom', label: 'Custom' },
]

export const ASPECT_RATIOS: Array<{ value: AspectRatio; label: string; icon: string }> = [
  { value: '16:9', label: '16:9', icon: '▬' },
  { value: '9:16', label: '9:16', icon: '▮' },
  { value: '1:1', label: '1:1', icon: '■' },
  { value: '21:9', label: '21:9', icon: '▬▬' },
]

export const ALL_MODELS = [
  { group: 'Budget', models: ['animatediff', 'wan'] },
  { group: 'Standard', models: ['luma', 'pika', 'minimax'] },
  { group: 'Professional', models: ['kling_standard', 'kling_pro', 'seedance'] },
  { group: 'Cinema', models: ['runway', 'veo3'] },
]

export interface GeneratedClip {
  id: string
  jobId: string
  prompt: string
  videoUrl?: string
  thumbnailUrl?: string
  model: string
  quality: QualityTier
  creditsUsed: number
  duration: number
  aspectRatio: AspectRatio
  status: 'queued' | 'processing' | 'complete' | 'failed'
  progress?: number
  progressMessage?: string
  error?: string
  createdAt: Date
}

export const MODEL_FAMILY_COLOURS: Record<string, string> = {
  kling_standard: '#3b82f6',
  kling_pro: '#2563eb',
  veo3: '#7c3aed',
  seedance: '#0d9488',
  runway: '#db2777',
  luma: '#ea580c',
  pika: '#00b8a0',
  minimax: '#059669',
  animatediff: '#6b7280',
  wan: '#78716c',
}
