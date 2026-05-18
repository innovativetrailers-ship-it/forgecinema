import type { GenerateVideoInput, GenerateVideoOutput } from './types'

const BASE_URL = 'https://api.minimax.chat/v1'

async function minimaxRequest<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.MINIMAX_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Minimax API error ${res.status}: ${err}`)
  }
  return res.json()
}

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  interface MinimaxTask {
    task_id: string
    base_resp: { status_code: number; status_msg: string }
  }

  const body = {
    model: 'video-01',
    prompt: input.prompt,
    ...(input.negativePrompt && { negative_prompt: input.negativePrompt }),
    ...(input.startFrameUrl && { first_frame_image: input.startFrameUrl }),
  }

  const data = await minimaxRequest<MinimaxTask>('POST', '/video_generation', body)

  if (data.base_resp.status_code !== 0) {
    throw new Error(`Minimax error: ${data.base_resp.status_msg}`)
  }

  return { jobId: data.task_id, status: 'pending' }
}

export async function pollStatus(
  externalJobId: string
): Promise<GenerateVideoOutput> {
  interface MinimaxStatus {
    task_id: string
    status: 'Preparing' | 'Processing' | 'Success' | 'Fail'
    file_id?: string
    base_resp: { status_code: number; status_msg: string }
  }

  const data = await minimaxRequest<MinimaxStatus>(
    'GET',
    `/query/video_generation?task_id=${externalJobId}`
  )

  if (data.status === 'Success' && data.file_id) {
    // Retrieve file URL
    interface MinimaxFile {
      file: { download_url: string }
    }
    const fileData = await minimaxRequest<MinimaxFile>(
      'GET',
      `/files/retrieve?file_id=${data.file_id}`
    )
    return {
      jobId: externalJobId,
      status: 'complete',
      videoUrl: fileData.file.download_url,
    }
  }

  if (data.status === 'Fail') {
    return {
      jobId: externalJobId,
      status: 'failed',
      error: data.base_resp.status_msg ?? 'Minimax generation failed',
    }
  }

  return { jobId: externalJobId, status: 'processing' }
}
