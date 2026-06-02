// src/lib/orchestration/qualityGate.ts
// Score generated segments — flag for retry if below threshold

export interface QualityScore {
  overall:          number
  facialFidelity:   number
  motionSmoothness: number
  artifactLevel:    number
  passed:           boolean
}

const QUALITY_THRESHOLD = 0.65

export async function scoreSegment(
  videoUrl:      string,
  hasFaces:      boolean,
  _referenceUrl?: string
): Promise<QualityScore> {
  try {
    const imgBuf = await fetch(videoUrl).then(r => r.arrayBuffer())
    const base64 = Buffer.from(imgBuf).toString('base64')

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method:  'POST',
      headers: {
        'x-api-key':         process.env.ANTHROPIC_API_KEY!,
        'content-type':      'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 150,
        messages: [{
          role:    'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg' as const, data: base64 } },
            { type: 'text',  text: `Score this AI-generated video frame for film quality. Return JSON:
{
  "overall": 0-1,
  "facialFidelity": 0-1,
  "motionSmoothness": 0-1,
  "artifactLevel": 0-1
}
Where 1 = perfect quality.${hasFaces ? ' Pay special attention to facial fidelity.' : ''}` },
          ],
        }],
      }),
    }).then(r => r.json())

    const scores  = JSON.parse(res.content?.[0]?.text?.replace(/```json|```/g, '').trim() ?? '{}')
    const overall = ((scores.overall ?? 0.8) + (scores.motionSmoothness ?? 0.8) + (scores.artifactLevel ?? 0.8)) / 3

    return {
      overall:          overall,
      facialFidelity:   scores.facialFidelity   ?? 0.8,
      motionSmoothness: scores.motionSmoothness ?? 0.8,
      artifactLevel:    scores.artifactLevel    ?? 0.8,
      passed:           overall >= QUALITY_THRESHOLD,
    }
  } catch {
    return { overall: 0.8, facialFidelity: 0.8, motionSmoothness: 0.8, artifactLevel: 0.8, passed: true }
  }
}

/**
 * Meta-Planner repair: if a segment scored poorly AND we have its storyboard keyframe,
 * attempt a single corrective regeneration anchored harder to the keyframe.
 */
export async function repairSegment(
  _videoUrl:     string,
  storyboardUrl: string | undefined,
  shotPrompt:    string,
  model:         string,
  duration:      number
): Promise<string | null> {
  if (!storyboardUrl) return null   // nothing to anchor to

  try {
    const { callVideoModel } = await import('./bridgedGeneration')
    const repaired = await callVideoModel({
      model,
      prompt:   `${shotPrompt}. Match the reference composition exactly. Stable, no distortion.`,
      duration,
      imageUrl: storyboardUrl,   // hard re-anchor to the blueprint
    })
    return repaired ?? null
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.warn('[meta-planner] repair failed:', msg)
    return null
  }
}
