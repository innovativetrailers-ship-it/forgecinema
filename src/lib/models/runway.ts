import type { GenerateVideoInput, GenerateVideoOutput } from './types'

type I2VRatio = '1280:720' | '720:1280' | '1104:832' | '832:1104' | '960:960' | '1584:672'
type T2VRatio = '1280:720' | '720:1280'

function mapI2VRatio(ratio?: string): I2VRatio {
  const map: Record<string, I2VRatio> = {
    '16:9': '1280:720',
    '9:16': '720:1280',
    '4:3': '1104:832',
    '3:4': '832:1104',
    '1:1': '960:960',
  }
  return map[ratio ?? '16:9'] ?? '1280:720'
}

function mapT2VRatio(ratio?: string): T2VRatio {
  return ratio === '9:16' ? '720:1280' : '1280:720'
}

async function getRunwayClient() {
  const apiKey = process.env.RUNWAY_API_KEY
  if (!apiKey) throw new Error('RUNWAY_API_KEY not configured')
  const RunwayML = (await import('@runwayml/sdk')).default
  return new RunwayML({ apiKey })
}

export async function generateVideo(
  input: GenerateVideoInput
): Promise<GenerateVideoOutput> {
  const client = await getRunwayClient()
  const duration = Math.min(Math.max(2, Math.round(input.duration)), 10)

  if (input.startFrameUrl) {
    const task = await client.imageToVideo.create({
      model: 'gen4_turbo',
      promptText: input.prompt,
      promptImage: input.startFrameUrl,
      duration,
      ratio: mapI2VRatio(input.aspectRatio),
    })
    return { jobId: task.id, status: 'pending' }
  }

  const task = await client.textToVideo.create({
    model: 'gen4.5',
    promptText: input.prompt,
    duration,
    ratio: mapT2VRatio(input.aspectRatio),
  })
  return { jobId: task.id, status: 'pending' }
}

function taskFailureMessage(task: { status: string; failure?: string; failureCode?: string }): string {
  return task.failure ?? task.failureCode ?? 'Runway generation failed'
}

export async function pollStatus(
  externalJobId: string
): Promise<GenerateVideoOutput> {
  const client = await getRunwayClient()

  for (let i = 0; i < 300; i++) {
    const task = await client.tasks.retrieve(externalJobId)

    if (task.status === 'SUCCEEDED') {
      return {
        jobId: externalJobId,
        status: 'complete',
        videoUrl: task.output?.[0],
      }
    }

    if (task.status === 'FAILED' || task.status === 'CANCELLED') {
      return {
        jobId: externalJobId,
        status: 'failed',
        error: taskFailureMessage(task),
      }
    }

    await new Promise((r) => setTimeout(r, 3000))
  }

  return { jobId: externalJobId, status: 'processing' }
}
