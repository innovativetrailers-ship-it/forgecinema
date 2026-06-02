// src/lib/orchestration/opticalFlow.ts
// Analyse motion direction from tail frame → inject into next segment's prompt

interface MotionVector {
  direction:   string
  velocity:    'slow' | 'medium' | 'fast'
  description: string
}

export async function analyseFrameMotion(frameUrl: string): Promise<MotionVector> {
  const imgBuf  = await fetch(frameUrl).then(r => r.arrayBuffer())
  const base64  = Buffer.from(imgBuf).toString('base64')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:  'POST',
    headers: {
      'x-api-key':         process.env.ANTHROPIC_API_KEY!,
      'content-type':      'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model:      'claude-haiku-4-5-20251001',
      max_tokens: 100,
      messages: [{
        role:    'user',
        content: [
          {
            type:   'image',
            source: { type: 'base64', media_type: 'image/jpeg' as const, data: base64 },
          },
          {
            type: 'text',
            text: `Analyse this video frame and estimate the dominant camera motion direction.
Return JSON only: { "direction": "pan_right|pan_left|tilt_up|tilt_down|zoom_in|zoom_out|static", "velocity": "slow|medium|fast" }`,
          },
        ],
      }],
    }),
  }).then(r => r.json())

  try {
    const parsed = JSON.parse(res.content?.[0]?.text?.replace(/```json|```/g, '').trim() ?? '{}')
    const dir    = (parsed.direction ?? 'static') as string
    const vel    = (parsed.velocity  ?? 'medium') as 'slow' | 'medium' | 'fast'
    return { direction: dir, velocity: vel, description: buildMotionDescription(dir, vel) }
  } catch {
    return { direction: 'static', velocity: 'slow', description: 'continuing from previous shot' }
  }
}

function buildMotionDescription(direction: string, velocity: string): string {
  const DIRECTION_MAP: Record<string, string> = {
    pan_right: 'continuing pan-right camera movement',
    pan_left:  'continuing pan-left camera movement',
    tilt_up:   'continuing upward tilt',
    tilt_down: 'continuing downward camera tilt',
    zoom_in:   'continuing push-in zoom',
    zoom_out:  'continuing pull-out zoom',
    static:    'camera beginning from rest',
  }
  const VELOCITY_MAP: Record<string, string> = {
    slow:   'at slow deliberate pace',
    medium: 'at medium speed',
    fast:   'at high velocity',
  }
  return `${DIRECTION_MAP[direction] ?? 'camera continuing'} ${VELOCITY_MAP[velocity] ?? ''}`
}

export function injectMotionContext(
  basePrompt:    string,
  motionVector:  MotionVector,
  previousShot?: { contentType: string; lighting: string }
): string {
  const motionHint         = `${motionVector.description}.`
  const lightingContinuity = previousShot
    ? ` Maintain consistent ${previousShot.lighting} lighting from previous shot.`
    : ''
  return `${basePrompt} ${motionHint}${lightingContinuity}`
}
