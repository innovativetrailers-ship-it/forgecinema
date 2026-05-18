import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const BASE_URL = 'https://api.runwayml.com/v1'

async function runwayRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.RUNWAY_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Runway-Version': '2024-11-06',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Runway API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  interface RunwayTask {
    id: string
  }

  const endpoint = input.startFrameUrl ? '/image_to_video' : '/text_to_video'

  const body = {
    promptText: input.prompt,
    ...(input.negativePrompt && { negativeText: input.negativePrompt }),
    ...(input.startFrameUrl && { promptImage: input.startFrameUrl }),
    ratio: input.aspectRatio === '9:16' ? '720:1280' : '1280:720',
    duration: Math.min(input.duration, 16),
    ...(input.seed !== undefined && { seed: input.seed }),
  }

  const data = await runwayRequest<RunwayTask>('POST', endpoint, body)

  return { jobId: data.id, status: 'pending' }
}

export async function pollStatus(
  externalJobId: string
): Promise<GenerateVideoOutput> {
  interface RunwayTaskStatus {
    id: string
    status: 'PENDING' | 'RUNNING' | 'SUCCEEDED' | 'FAILED' | 'CANCELLED'
    failure?: string
    output?: string[]
  }

  const data = await runwayRequest<RunwayTaskStatus>(
    'GET',
    `/tasks/${externalJobId}`
  )

  if (data.status === 'SUCCEEDED') {
    return {
      jobId: externalJobId,
      status: 'complete',
      videoUrl: data.output?.[0],
    }
  }

  if (data.status === 'FAILED' || data.status === 'CANCELLED') {
    return {
      jobId: externalJobId,
      status: 'failed',
      error: data.failure ?? 'Runway generation failed',
    }
  }

  return { jobId: externalJobId, status: 'processing' }
}
