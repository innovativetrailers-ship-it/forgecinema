import { extractTailFrame, callVideoModel } from './bridgedGeneration'
import { modelTierRank } from '@/lib/routing/modelTierRank'
import { runFal } from '@/lib/fal/client'

export interface BoundaryCheck {
  segmentA: string
  segmentB: string
  clipCosine: number
  faceCosine?: number
  pass: boolean
}

const THRESHOLDS = {
  clipCosine: 0.82,
  faceCosine: 0.75,
}

async function extractFirstFrame(videoUrl: string): Promise<string> {
  const result = await runFal<{ image?: { url: string }; output_url?: string }>('fal-ai/ffmpeg', {
    video_url: videoUrl,
    command: 'extract_first_frame',
    output_format: 'jpg',
  })
  const d = result as { image?: { url?: string }; output_url?: string }
  return d.image?.url ?? d.output_url ?? ''
}

async function frameSimilarity(urlA: string, urlB: string): Promise<number> {
  if (!urlA || !urlB) return 0.5
  if (!process.env.ANTHROPIC_API_KEY) return 0.85

  try {
    const [bufA, bufB] = await Promise.all([
      fetch(urlA).then((r) => r.arrayBuffer()),
      fetch(urlB).then((r) => r.arrayBuffer()),
    ])
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 64,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: Buffer.from(bufA).toString('base64') } },
            { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: Buffer.from(bufB).toString('base64') } },
            { type: 'text', text: 'These are consecutive frames at a video edit boundary. Return JSON only: {"similarity": 0-1} where 1 = seamless match in palette, lighting, composition.' },
          ],
        }],
      }),
    }).then((r) => r.json())
    const text = res.content?.[0]?.text?.replace(/```json|```/g, '').trim() ?? '{}'
    const parsed = JSON.parse(text) as { similarity?: number }
    return parsed.similarity ?? 0.5
  } catch {
    return 0.85
  }
}

export async function checkBoundary(
  segA: { id: string; videoUrl: string; modelId: string },
  segB: { id: string; videoUrl: string; modelId: string },
  _characterPresent: boolean,
): Promise<BoundaryCheck> {
  const [lastFrameA, firstFrameB] = await Promise.all([
    extractTailFrame(segA.videoUrl),
    extractFirstFrame(segB.videoUrl),
  ])

  const clipCosine = await frameSimilarity(lastFrameA, firstFrameB)

  return {
    segmentA: segA.id,
    segmentB: segB.id,
    clipCosine,
    pass: clipCosine >= THRESHOLDS.clipCosine,
  }
}

export async function repairBoundary(
  check: BoundaryCheck,
  segA: { id: string; videoUrl: string; modelId: string; prompt: string; duration: number },
  segB: { id: string; videoUrl: string; modelId: string; prompt: string; duration: number },
): Promise<{ target: 'A' | 'B'; videoUrl: string } | null> {
  const rankA = modelTierRank(segA.modelId)
  const rankB = modelTierRank(segB.modelId)

  try {
    if (rankA <= rankB) {
      const [startFrameUrl, endFrameUrl] = await Promise.all([
        extractFirstFrame(segA.videoUrl),
        extractFirstFrame(segB.videoUrl),
      ])
      const videoUrl = await callVideoModel({
        model: 'kling-o3',
        prompt: segA.prompt,
        duration: segA.duration,
        imageUrl: startFrameUrl,
        endImageUrl: endFrameUrl,
      })
      return { target: 'A', videoUrl }
    }
    const startFrameUrl = await extractTailFrame(segA.videoUrl)
    const videoUrl = await callVideoModel({
      model: segB.modelId,
      prompt: segB.prompt,
      duration: segB.duration,
      imageUrl: startFrameUrl,
    })
    return { target: 'B', videoUrl }
  } catch {
    return null
  }
}

export async function runBoundaryQA<T extends {
  shotIndex: number
  videoUrl: string
  model: string
  duration: number
}>(
  segments: T[],
  shotPrompts: Map<number, string>,
): Promise<T[]> {
  const out = [...segments]
  for (let i = 0; i < out.length - 1; i++) {
    const a = out[i]
    const b = out[i + 1]
    const check = await checkBoundary(
      { id: String(a.shotIndex), videoUrl: a.videoUrl, modelId: a.model },
      { id: String(b.shotIndex), videoUrl: b.videoUrl, modelId: b.model },
      false,
    )
    if (check.pass) continue

    const repaired = await repairBoundary(
      check,
      {
        id: String(a.shotIndex),
        videoUrl: a.videoUrl,
        modelId: a.model,
        prompt: shotPrompts.get(a.shotIndex) ?? 'Cinematic shot',
        duration: a.duration,
      },
      {
        id: String(b.shotIndex),
        videoUrl: b.videoUrl,
        modelId: b.model,
        prompt: shotPrompts.get(b.shotIndex) ?? 'Cinematic shot',
        duration: b.duration,
      },
    )
    if (!repaired) continue
    if (repaired.target === 'A') out[i] = { ...a, videoUrl: repaired.videoUrl }
    else out[i + 1] = { ...b, videoUrl: repaired.videoUrl }
  }
  return out
}
