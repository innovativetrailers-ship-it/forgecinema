import type { RLHFLog } from '@/generated/prisma/client'

export const rlhfMeta = (signal: RLHFLog) => {
  const opts = (signal.modelOptions ?? {}) as Record<string, unknown>
  const ctx = (signal.context ?? {}) as Record<string, unknown>
  return {
    promptRaw: String(opts.rawPrompt ?? signal.promptText),
    promptEnhanced: signal.promptText,
    videoUrl: String(opts.videoUrl ?? ctx.videoUrl ?? ''),
    qualityScore:
      typeof opts.qualityScore === 'number'
        ? opts.qualityScore
        : typeof ctx.qualityScore === 'number'
          ? ctx.qualityScore
          : undefined,
  }
}
