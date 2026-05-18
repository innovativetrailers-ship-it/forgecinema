export interface ImportedMediaItem {
  name: string
  filePath: string
  duration: number
}

export interface ImportedClipSegment {
  startTime: number
  duration: number
  sourceMediaId?: string
}

export interface ImportedTrack {
  type: 'video' | 'audio'
  clips: ImportedClipSegment[]
}

export interface ImportedSequence {
  name: string
  id: string
  duration: number
  frameRate: number
  tracks: ImportedTrack[]
}

export interface ImportedBin {
  name: string
  id: string
}

export interface ImportedProject {
  projectName: string
  sequences: ImportedSequence[]
  bins: ImportedBin[]
  mediaItems: ImportedMediaItem[]
}
