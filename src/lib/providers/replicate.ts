import { assertGenerationNotPaused } from '@/lib/generation/pause'
import type { ModelDef } from '@/lib/models/resolve'
import type { SubProgressFn } from '@/lib/orchestration/types'

async function pollReplicate(
  getUrl: string,
  token: string,
  onSubProgress?: SubProgressFn,
): Promise<string> {
  for (let i = 0; i < 600; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(getUrl, {
      headers: { Authorization: `Bearer ${token}` },
    }).then((r) => r.json())
    if (res.status === 'starting' || res.status === 'processing') {
      const pct = Math.min(90, Math.round((i / 600) * 100))
      onSubProgress?.({ pct, message: `Sora 2 generating ${pct}%`, vendor: 'replicate' })
    } else if (res.status === 'succeeded') {
      onSubProgress?.({ pct: 100, message: 'Sora 2 complete', vendor: 'replicate' })
      const url = Array.isArray(res.output) ? res.output[0] : res.output
      if (!url) throw new Error('Sora 2 returned no video URL')
      return url
    } else if (res.status === 'failed' || res.status === 'canceled') {
      throw new Error(`Sora 2 ${res.status}: ${res.error ?? 'unknown'}`)
    }
  }
  throw new Error('Sora 2 timed out after 20 min')
}

export interface ReplicateVideoParams {
  prompt: string
  duration: number
  imageUrl?: string
  onSubProgress?: SubProgressFn
}

export async function replicateVideo(
  _model: ModelDef,
  params: ReplicateVideoParams,
): Promise<string> {
  assertGenerationNotPaused('replicate:sora-2')
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) throw new Error('sora-2 requires REPLICATE_API_TOKEN')

  const create = await fetch('https://api.replicate.com/v1/models/openai/sora-2/predictions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      input: {
        prompt: params.prompt,
        seconds: Math.min(params.duration, 20),
        ...(params.imageUrl ? { input_image: params.imageUrl } : {}),
      },
    }),
  }).then((r) => r.json())

  const getUrl = create.urls?.get ?? `https://api.replicate.com/v1/predictions/${create.id}`
  return pollReplicate(getUrl, token, params.onSubProgress)
}
