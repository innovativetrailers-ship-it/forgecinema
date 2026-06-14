import type { GenerateVideoInput, GenerateVideoOutput } from './types'

async function pollReplicate(getUrl: string, token: string): Promise<string> {
  for (let i = 0; i < 600; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(getUrl, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json() as { status: string; output?: string | string[]; error?: string }
    if (data.status === 'succeeded') {
      return Array.isArray(data.output) ? data.output[0] : (data.output as string)
    }
    if (data.status === 'failed' || data.status === 'canceled') {
      throw new Error(`Sora 2 ${data.status}: ${data.error ?? 'unknown'}`)
    }
  }
  throw new Error('Sora 2 timed out')
}

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    return { jobId: 'sora-missing', status: 'failed', error: 'REPLICATE_API_TOKEN not configured' }
  }
  try {
    const create = await fetch('https://api.replicate.com/v1/models/openai/sora-2/predictions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: {
          prompt: input.prompt,
          seconds: Math.min(input.duration, 20),
          ...(input.startFrameUrl ? { input_image: input.startFrameUrl } : {}),
        },
      }),
    })
    const created = await create.json() as { id: string; urls?: { get: string } }
    const getUrl = created.urls?.get ?? `https://api.replicate.com/v1/predictions/${created.id}`
    const videoUrl = await pollReplicate(getUrl, token)
    return { jobId: created.id, status: 'complete', videoUrl }
  } catch (err) {
    return {
      jobId: `sora-${Date.now()}`,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Sora generation failed',
    }
  }
}

export async function pollStatus(externalJobId: string): Promise<GenerateVideoOutput> {
  return { jobId: externalJobId, status: 'complete' }
}
