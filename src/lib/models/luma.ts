import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const BASE_URL = 'https://api.lumalabs.ai/dream-machine/v1'

async function lumaRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.LUMA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Luma API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  interface LumaGeneration {
    id: string
    state: string
  }

  const body = {
    prompt: input.prompt,
    aspect_ratio: input.aspectRatio,
    duration: input.duration,
    ...(input.startFrameUrl && {
      keyframes: {
        frame0: { type: 'image', url: input.startFrameUrl },
      },
    }),
    ...(input.endFrameUrl && {
      keyframes: {
        frame1: { type: 'image', url: input.endFrameUrl },
      },
    }),
  }

  const data = await lumaRequest<LumaGeneration>('POST', '/generations', body)

  return {
    jobId: data.id,
    status: 'pending',
  }
}

export async function pollStatus(
  externalJobId: string
): Promise<GenerateVideoOutput> {
  interface LumaPollResult {
    id: string
    state: 'pending' | 'dreaming' | 'completed' | 'failed'
    failure_reason?: string
    assets?: { video?: string }
  }

  const data = await lumaRequest<LumaPollResult>(
    'GET',
    `/generations/${externalJobId}`
  )

  if (data.state === 'completed') {
    return {
      jobId: externalJobId,
      status: 'complete',
      videoUrl: data.assets?.video,
    }
  }

  if (data.state === 'failed') {
    return {
      jobId: externalJobId,
      status: 'failed',
      error: data.failure_reason ?? 'Luma generation failed',
    }
  }

  return { jobId: externalJobId, status: 'processing' }
}
