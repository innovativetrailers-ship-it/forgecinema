import type { ShotSpec } from '../shotSpec'
import { findVideoRegistry, registryKey, type VideoRegistryEntry } from './registry'

export class ModelCompileError extends Error {
  readonly model: string
  readonly reason: string

  constructor(model: string, reason: string) {
    super(`${model}: ${reason}`)
    this.name = 'ModelCompileError'
    this.model = model
    this.reason = reason
  }
}

export interface CompiledShot {
  prompt: string
  params: Record<string, unknown>
  duration_s: number
}

function nearestDuration(requested: number, allowed: number[]): number {
  const sorted = [...allowed].sort((a, b) => a - b)
  let best = sorted[0]
  let bestGap = Math.abs(requested - best)
  for (const value of sorted) {
    const gap = Math.abs(requested - value)
    if (gap < bestGap || (gap === bestGap && value < best)) {
      best = value
      bestGap = gap
    }
  }
  return best
}

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

function capWords(text: string, cap: number): string {
  const list = words(text)
  if (list.length <= cap) return text
  return list.slice(0, cap).join(' ')
}

function dialogueLine(entry: VideoRegistryEntry, speaker: string, voice: string, line: string): string {
  if (entry.dialogue === 'kling') return `[${speaker}: ${voice}]: "${line}"`
  if (entry.dialogue === 'quoted') return `${speaker} (${voice}): "${line}"`
  if (entry.dialogue === 'prose') return `${speaker} says, in a ${voice} voice, ${line}`
  return ''
}

function referenceLine(entry: VideoRegistryEntry, index: number, role: string): string {
  if (entry.referenceSyntax.startsWith('@')) {
    return `@Image${index + 1} (${role})`
  }
  return `reference ${index + 1}: ${role}`
}

/** Turn one shot spec into the model's dialect. Retired and unknown models throw. */
export function compileShot(shot: ShotSpec, modelKey: string): CompiledShot {
  const entry = findVideoRegistry(modelKey)
  if (!entry) {
    throw new ModelCompileError(modelKey, 'unknown model, no registry row')
  }
  const name = registryKey(entry)
  if (entry.status === 'retired') {
    throw new ModelCompileError(name, 'retired')
  }
  if (entry.maxReferences > 0 && shot.references.length > entry.maxReferences) {
    throw new ModelCompileError(name, `accepts ${entry.maxReferences} references, got ${shot.references.length}`)
  }
  const duration = entry.durations.length ? nearestDuration(shot.duration_s, entry.durations) : shot.duration_s
  const voices = new Map<string, string>()
  const lines: string[] = []
  if (entry.dialogue !== 'none') {
    for (const line of shot.audio.dialogue) {
      const prior = voices.get(line.speaker)
      if (prior && prior !== line.voice) {
        throw new ModelCompileError(name, `voice descriptor for ${line.speaker} changed`)
      }
      voices.set(line.speaker, line.voice)
      lines.push(dialogueLine(entry, line.speaker, line.voice, line.line))
    }
  }
  const camera = shot.camera
    ? `${shot.camera.size}, ${shot.camera.angle}, ${shot.camera.lens_mm}mm, ${shot.camera.move}, ${shot.camera.pace}`
    : ''
  const parts = [
    `${shot.subject}. ${shot.action}.`,
    shot.setting,
    camera,
    shot.lighting ?? '',
    shot.grade ?? '',
    lines.join(' '),
    shot.audio.sfx.length ? `Sounds: ${shot.audio.sfx.join(', ')}.` : '',
    shot.audio.ambience ? `Ambience: ${shot.audio.ambience}.` : '',
    `Music: ${shot.audio.music ? 'yes' : 'no'}.`,
    shot.references.map((ref, index) => referenceLine(entry, index, ref.role)).join(' '),
  ].filter(Boolean)
  if (entry.negative === 'prose' && shot.avoid.length) {
    parts.push(`Keep out: ${shot.avoid.join(', ')}.`)
  }
  let prompt = parts.join(' ')
  if (entry.wordCap) prompt = capWords(prompt, entry.wordCap)
  if (entry.charCap && prompt.length > entry.charCap) prompt = prompt.slice(0, entry.charCap)
  const params: Record<string, unknown> = {
    duration: entry.durationEncoding === 'seconds-string' ? `${duration}s` : duration,
    source_tier: entry.source_tier,
    status: entry.status,
  }
  if (entry.negative === 'field') params.negative_prompt = shot.avoid.join(', ')
  if (entry.negative === 'never' && 'negative_prompt' in params) {
    delete params.negative_prompt
  }
  return { prompt, params, duration_s: duration }
}
