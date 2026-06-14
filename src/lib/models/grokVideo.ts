import type { GenerateVideoInput, GenerateVideoOutput } from './types'

async function pollXAIVideo(requestId: string, maxAttempts = 150): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 2000))
    const res = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      headers: { Authorization: `Bearer ${process.env.XAI_API_KEY}` },
    })
    const data = await res.json() as { status: string; video?: { url: string }; error?: string }
    if (data.status === 'done') return data.video!.url
    if (data.status === 'failed') throw new Error(`Grok Imagine failed: ${data.error}`)
  }
  throw new Error('Grok Imagine timed out')
}

export async function generateVideo(input: GenerateVideoInput): Promise<GenerateVideoOutput> {
  try {
    const res = await fetch('https://api.x.ai/v1/videos/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-imagine-video',
        prompt: input.prompt,
        duration: Math.min(input.duration, 15),
        aspect_ratio: '16:9',
        resolution: '720p',
        ...(input.startFrameUrl ? { image_url: input.startFrameUrl } : {}),
      }),
    })
    if (!res.ok) throw new Error(`Grok Imagine: ${await res.text()}`)
    const data = await res.json() as { request_id: string }
    const videoUrl = await pollXAIVideo(data.request_id)
    return { jobId: data.request_id, status: 'complete', videoUrl }
  } catch (err) {
    return {
      jobId: `xai-${Date.now()}`,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Grok video generation failed',
    }
  }
}

export async function pollStatus(externalJobId: string): Promise<GenerateVideoOutput> {
  return { jobId: externalJobId, status: 'complete' }
}
