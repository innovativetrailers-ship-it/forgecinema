import { logExpertBrief } from '../../llm/routing'
import { openRouterEnvelope } from './openrouter'
import { ROLE_BRIEFS, type ExpertRole } from '../validate'

export interface GeminiExpertRequest {
  contents: Array<{
    role: 'user'
    parts: Array<
      | { fileData: { mimeType: string; fileUri: string }; videoMetadata: { fps: number } }
      | { text: string }
    >
  }>
  generationConfig: { responseSchema: unknown }
  openrouter: Record<string, unknown>
}

function mmss(seconds: number): string {
  const whole = Math.max(0, Math.floor(seconds))
  const mm = String(Math.floor(whole / 60)).padStart(2, '0')
  const ss = String(whole % 60).padStart(2, '0')
  return `${mm}:${ss}`
}

/** Video first, then text. Timestamps are MM:SS. fps is configurable. */
export function buildGeminiRequest(
  role: ExpertRole,
  input: { text: string; videoUri: string; mimeType?: string; fps?: number; atSeconds?: number[] },
): GeminiExpertRequest {
  const brief = ROLE_BRIEFS[role]
  logExpertBrief(role, brief.version)
  const fps = input.fps ?? 1
  const marks = (input.atSeconds ?? []).map(mmss).join(', ')
  const text = [
    brief.identity,
    brief.scope,
    input.text,
    marks ? `Confirm these timestamps: ${marks}. Prefer the labelled frame ids.` : '',
    'Boxes, if you return them, use box_2d as [ymin, xmin, ymax, xmax] from 0 to 1000.',
  ].filter(Boolean).join('\n\n')
  return {
    contents: [{
      role: 'user',
      parts: [
        {
          fileData: { mimeType: input.mimeType ?? 'video/mp4', fileUri: input.videoUri },
          videoMetadata: { fps },
        },
        { text },
      ],
    }],
    generationConfig: { responseSchema: brief.outputSchema },
    openrouter: openRouterEnvelope(brief.outputSchema),
  }
}

export { mmss as formatGeminiTimestamp }
