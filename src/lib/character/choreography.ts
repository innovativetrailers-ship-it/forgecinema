import type { FCCCharacter } from './fccSchema'
import { buildModificationPrompt } from './identityLock'
import type { ChoreographyPlan } from './characterMotion'

function fallbackPlan(actionPrompt: string, durationSec: number): ChoreographyPlan {
  const mid = Math.max(1, durationSec / 2)
  return {
    segments: [
      {
        startSec: 0,
        endSec: mid,
        motion: `Setup: ${actionPrompt}`,
        cameraAngle: 'medium',
        bodyPart: 'full body',
        intensity: 0.5,
      },
      {
        startSec: mid,
        endSec: durationSec,
        motion: `Peak: ${actionPrompt}`,
        cameraAngle: 'close',
        bodyPart: 'full body',
        intensity: 0.8,
      },
    ],
  }
}

export async function promptToChoreography(
  character: FCCCharacter,
  actionPrompt: string,
  durationSec: number,
): Promise<ChoreographyPlan> {
  if (!process.env.ANTHROPIC_API_KEY) return fallbackPlan(actionPrompt, durationSec)

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system:
          'You are a choreography director. Break down an action into timed motion segments. Return ONLY JSON: { "segments": [{ "startSec", "endSec", "motion", "cameraAngle", "bodyPart", "intensity" }] }',
        messages: [
          {
            role: 'user',
            content: `Character: ${character.name} (${buildModificationPrompt(character.appearance)})
Action: ${actionPrompt}
Duration: ${durationSec}s`,
          },
        ],
      }),
    })
    const json = (await res.json()) as { content?: Array<{ type: string; text?: string }> }
    const text = json.content?.find((c) => c.type === 'text')?.text ?? '{}'
    const parsed = JSON.parse(text.replace(/```json|```/g, '').trim()) as ChoreographyPlan
    if (Array.isArray(parsed.segments) && parsed.segments.length > 0) return parsed
  } catch {
    // fall through
  }
  return fallbackPlan(actionPrompt, durationSec)
}
