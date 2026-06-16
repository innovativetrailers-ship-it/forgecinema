import { assertGenerationNotPaused } from '@/lib/generation/pause'
import type { ModelDef } from '@/lib/models/resolve'
import type { SubProgressFn } from '@/lib/orchestration/types'

async function pollXAIVideo(
  requestId: string,
  onSubProgress?: SubProgressFn,
): Promise<string> {
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('Grok Imagine requires XAI_API_KEY')

  const MAX = 300
  for (let i = 0; i < MAX; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    }).then((r) => r.json())
    if (res.status === 'pending') {
      const pct = Math.min(90, Math.round((i / MAX) * 100))
      onSubProgress?.({ pct, message: `Grok Imagine generating ${pct}%`, vendor: 'xai' })
    } else if (res.status === 'done') {
      onSubProgress?.({ pct: 100, message: 'Grok Imagine complete', vendor: 'xai' })
      const url = res.video?.url
      if (!url) throw new Error('Grok Imagine returned no video URL')
      return url
    } else if (res.status === 'failed') {
      throw new Error(`Grok Imagine failed: ${res.error}`)
    }
  }
  throw new Error('Grok Imagine timed out after 10 min')
}

export interface GrokVideoParams {
  prompt: string
  duration: number
  imageUrl?: string
  aspectRatio?: string
  onSubProgress?: SubProgressFn
}

export async function grokVideo(
  _model: ModelDef,
  params: GrokVideoParams,
): Promise<string> {
  assertGenerationNotPaused('xai:grok-imagine-video')
  const apiKey = process.env.XAI_API_KEY
  if (!apiKey) throw new Error('Grok Imagine requires XAI_API_KEY')

  const res = await fetch('https://api.x.ai/v1/videos/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'grok-imagine-video',
      prompt: params.prompt,
      duration: Math.min(params.duration, 15),
      aspect_ratio: params.aspectRatio ?? '16:9',
      ...(params.imageUrl ? { image_url: params.imageUrl } : {}),
    }),
  })
  if (!res.ok) {
    throw new Error(`Grok Imagine ${res.status}: ${await res.text()}`)
  }
  const data = await res.json()
  return pollXAIVideo(data.request_id, params.onSubProgress)
}
