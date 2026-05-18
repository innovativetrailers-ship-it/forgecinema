import { SignJWT } from 'jose'
import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const BASE_URL = 'https://api.klingai.com/v1'

async function getKlingToken(): Promise<string> {
  const secret = new TextEncoder().encode(process.env.KLING_API_SECRET!)
  return new SignJWT({ iss: process.env.KLING_API_KEY })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30m')
    .setIssuedAt()
    .sign(secret)
}

async function klingRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getKlingToken()
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Kling API error ${res.status}: ${err}`)
  }
  return res.json()
}

function mapAspectRatio(ar: string): string {
  const map: Record<string, string> = {
    '16:9': '16:9',
    '9:16': '9:16',
    '1:1': '1:1',
    '4:3': '4:3',
    '21:9': '16:9',
  }
  return map[ar] ?? '16:9'
}

export async function generateVideo(
  input: GenerateVideoInput,
  model: 'standard' | 'pro' = 'standard'
): Promise<GenerateVideoOutput> {
  const endpoint = input.startFrameUrl
    ? '/videos/image2video'
    : '/videos/text2video'

  interface KlingTask {
    task_id: string
  }

  const body = {
    model_name: model === 'pro' ? 'kling-v1-pro' : 'kling-v1',
    prompt: input.prompt,
    negative_prompt: input.negativePrompt,
    duration: input.duration,
    aspect_ratio: mapAspectRatio(input.aspectRatio),
    ...(input.startFrameUrl && { image_url: input.startFrameUrl }),
    ...(input.cameraMotion && { camera_type: input.cameraMotion }),
    ...(input.seed !== undefined && { seed: input.seed }),
  }

  const data = await klingRequest<{ data: KlingTask }>(
    'POST',
    endpoint,
    body
  )

  return {
    jobId: data.data.task_id,
    status: 'pending',
    pollUrl: `${BASE_URL}${endpoint}/${data.data.task_id}`,
  }
}

export async function pollStatus(
  externalJobId: string,
  isImageToVideo: boolean = false
): Promise<GenerateVideoOutput> {
  const endpoint = isImageToVideo
    ? `/videos/image2video/${externalJobId}`
    : `/videos/text2video/${externalJobId}`

  interface KlingPollResult {
    data: {
      task_id: string
      task_status: string
      task_result?: { videos?: Array<{ url: string; cover_image_url?: string }> }
      task_status_msg?: string
    }
  }

  const data = await klingRequest<KlingPollResult>('GET', endpoint)
  const task = data.data

  if (task.task_status === 'succeed') {
    const video = task.task_result?.videos?.[0]
    return {
      jobId: externalJobId,
      status: 'complete',
      videoUrl: video?.url,
      thumbnailUrl: video?.cover_image_url,
    }
  }

  if (task.task_status === 'failed') {
    return {
      jobId: externalJobId,
      status: 'failed',
      error: task.task_status_msg ?? 'Kling generation failed',
    }
  }

  return { jobId: externalJobId, status: 'processing' }
}
