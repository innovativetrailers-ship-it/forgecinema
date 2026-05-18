import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const PROJECT = process.env.GOOGLE_PROJECT_ID ?? ''
const LOCATION = process.env.GOOGLE_LOCATION ?? 'us-central1'
const MODEL = 'veo-3.0-generate-preview'

const API_BASE = `https://${LOCATION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${LOCATION}/publishers/google/models/${MODEL}`

async function getAccessToken(): Promise<string> {
  // Use Application Default Credentials via metadata server or service account
  const { GoogleAuth } = await import('@google-cloud/vertexai').then(
    (m) => ({ GoogleAuth: (m as { GoogleAuth?: unknown }).GoogleAuth })
  ).catch(() => ({ GoogleAuth: null }))

  if (GoogleAuth) {
    // Vertex AI SDK path
    const auth = new (GoogleAuth as new (opts: Record<string, string[]>) => { getAccessToken: () => Promise<string> })({
      scopes: ['https://www.googleapis.com/auth/cloud-platform'],
    })
    return auth.getAccessToken()
  }

  throw new Error('GoogleAuth not available')
}

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const token = await getAccessToken()

  const body = {
    instances: [
      {
        prompt: input.prompt,
        ...(input.startFrameUrl && { image: { bytesBase64Encoded: '', gcsUri: input.startFrameUrl } }),
      },
    ],
    parameters: {
      aspectRatio: input.aspectRatio,
      durationSeconds: input.duration,
      ...(input.seed !== undefined && { seed: input.seed }),
      ...(input.negativePrompt && { negativePrompt: input.negativePrompt }),
    },
  }

  const res = await fetch(`${API_BASE}:predict`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Veo3 API error ${res.status}: ${err}`)
  }

  const data = await res.json() as { name?: string }

  // Veo3 returns a long-running operation
  return {
    jobId: data.name ?? '',
    status: 'pending',
    pollUrl: `https://${LOCATION}-aiplatform.googleapis.com/v1/${data.name}`,
  }
}

export async function pollStatus(operationName: string): Promise<GenerateVideoOutput> {
  const token = await getAccessToken()

  const res = await fetch(
    `https://${LOCATION}-aiplatform.googleapis.com/v1/${operationName}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!res.ok) {
    throw new Error(`Veo3 poll error ${res.status}`)
  }

  interface Veo3Operation {
    done?: boolean
    error?: { message?: string }
    response?: { videos?: Array<{ gcsUri?: string }> }
  }

  const data = await res.json() as Veo3Operation

  if (data.done) {
    if (data.error) {
      return { jobId: operationName, status: 'failed', error: data.error.message }
    }
    const videoUri = data.response?.videos?.[0]?.gcsUri
    return {
      jobId: operationName,
      status: 'complete',
      videoUrl: videoUri,
    }
  }

  return { jobId: operationName, status: 'processing' }
}
