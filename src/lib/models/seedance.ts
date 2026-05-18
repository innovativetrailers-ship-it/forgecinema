import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const BASE_URL = 'https://ark.ap-southeast.bytepluses.com/api/v3'
const MODEL = 'dreamina-seedance-2-0-260128'

type ContentRole = 'reference_image' | 'reference_video' | 'reference_audio'

interface ContentItem {
  type: 'text' | 'image_url' | 'video_url' | 'audio_url'
  text?: string
  image_url?: { url: string }
  video_url?: { url: string }
  audio_url?: { url: string }
  role?: ContentRole
}

interface ArkTaskResponse {
  id: string
  status: string
}

interface ArkTaskStatus {
  id: string
  status: 'pending' | 'running' | 'succeeded' | 'failed' | 'cancelled'
  error?: { message?: string }
  content?: Array<{
    type: string
    video_url?: { url: string }
    image_url?: { url: string }
  }>
}

async function arkRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.SEEDANCE_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Seedance/Ark API error ${res.status}: ${err}`)
  }
  return res.json()
}

export interface SeedanceInput extends GenerateVideoInput {
  /** Additional reference images beyond startFrameUrl */
  referenceImageUrls?: string[]
  referenceVideoUrl?: string
  referenceAudioUrl?: string
  generateAudio?: boolean
  watermark?: boolean
}

export async function generateVideo(
  input: SeedanceInput
): Promise<GenerateVideoOutput> {
  const content: ContentItem[] = [
    { type: 'text', text: input.prompt },
  ]

  if (input.startFrameUrl) {
    content.push({
      type: 'image_url',
      image_url: { url: input.startFrameUrl },
      role: 'reference_image',
    })
  }

  for (const url of input.referenceImageUrls ?? []) {
    content.push({
      type: 'image_url',
      image_url: { url },
      role: 'reference_image',
    })
  }

  if (input.referenceVideoUrl) {
    content.push({
      type: 'video_url',
      video_url: { url: input.referenceVideoUrl },
      role: 'reference_video',
    })
  }

  if (input.referenceAudioUrl) {
    content.push({
      type: 'audio_url',
      audio_url: { url: input.referenceAudioUrl },
      role: 'reference_audio',
    })
  }

  const body = {
    model: MODEL,
    content,
    ratio: input.aspectRatio,
    duration: input.duration,
    generate_audio: input.generateAudio ?? false,
    watermark: input.watermark ?? false,
  }

  const data = await arkRequest<ArkTaskResponse>(
    'POST',
    '/contents/generations/tasks',
    body
  )

  return { jobId: data.id, status: 'pending' }
}

export async function pollStatus(
  externalJobId: string
): Promise<GenerateVideoOutput> {
  const data = await arkRequest<ArkTaskStatus>(
    'GET',
    `/contents/generations/tasks/${externalJobId}`
  )

  if (data.status === 'succeeded') {
    const videoItem = data.content?.find((c) => c.type === 'video_url')
    const thumbItem = data.content?.find((c) => c.type === 'image_url')
    return {
      jobId: externalJobId,
      status: 'complete',
      videoUrl: videoItem?.video_url?.url,
      thumbnailUrl: thumbItem?.image_url?.url,
    }
  }

  if (data.status === 'failed' || data.status === 'cancelled') {
    return {
      jobId: externalJobId,
      status: 'failed',
      error: data.error?.message ?? `Seedance task ${data.status}`,
    }
  }

  return { jobId: externalJobId, status: 'processing' }
}
