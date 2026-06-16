import { isGenerationPaused } from '@/lib/generation/pause'

/**
 * Intelligence probe battery (118 FAL videos/model) is opt-in only.
 * Never runs in production unless ENABLE_INTELLIGENCE_PROBES=true AND pause is off.
 */
export function intelligenceProbesEnabled(): boolean {
  if (process.env.DISABLE_INTELLIGENCE_PROBES === 'true') return false
  if (isGenerationPaused()) return false
  return process.env.ENABLE_INTELLIGENCE_PROBES === 'true'
}

export function assertIntelligenceProbesAllowed(context: string): void {
  if (intelligenceProbesEnabled()) return
  throw new Error(
    `Intelligence probes blocked (${context}). Requires ENABLE_INTELLIGENCE_PROBES=true and GENERATION_PAUSED=false.`,
  )
}
