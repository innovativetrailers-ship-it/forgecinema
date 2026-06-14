import type { ModelDef } from '@/lib/models/resolve'
import type { SubProgressFn } from '@/lib/orchestration/types'

function runwayApiKey(): string {
  const key = process.env.RUNWAYML_API_SECRET ?? process.env.RUNWAY_API_KEY
  if (!key) {
    throw new Error('Runway requires RUNWAYML_API_SECRET or RUNWAY_API_KEY')
  }
  return key
}

async function pollRunwayJob(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  client: any,
  taskId: string,
  onSubProgress?: SubProgressFn,
): Promise<string> {
  for (let i = 0; i < 300; i++) {
    await new Promise((r) => setTimeout(r, 3000))
    const task = await client.tasks.retrieve(taskId)
    if (task.status === 'RUNNING') {
      const pct = Math.round((task.progress ?? 0.5) * 100)
      onSubProgress?.({ pct, message: `Runway rendering ${pct}%`, vendor: 'runway' })
    } else if (task.status === 'PENDING') {
      onSubProgress?.({ pct: 0, message: 'Runway queued', vendor: 'runway' })
    } else if (task.status === 'SUCCEEDED') {
      onSubProgress?.({ pct: 100, message: 'Runway complete', vendor: 'runway' })
      return task.output?.[0]
    } else if (task.status === 'FAILED') {
      throw new Error(`Runway failed: ${task.failure ?? 'unknown'}`)
    }
  }
  throw new Error('Runway timed out after 15 min')
}

function mapAspectRatio(aspectRatio?: string): '1280:720' | '720:1280' | '960:960' {
  if (aspectRatio === '9:16' || aspectRatio === '720:1280') return '720:1280'
  if (aspectRatio === '1:1' || aspectRatio === '960:960') return '960:960'
  return '1280:720'
}

type RunwaySdkModel = 'gen4_turbo' | 'veo3' | 'veo3.1' | 'gen4.5' | 'gen3a_turbo' | 'veo3.1_fast'

function resolveRunwayModel(endpoint: string | undefined): RunwaySdkModel {
  switch (endpoint) {
    case 'gen4.5':
    case 'runway-gen4.5':
      return 'gen4.5'
    case 'veo3':
      return 'veo3'
    case 'veo3.1':
      return 'veo3.1'
    case 'veo3.1_fast':
      return 'veo3.1_fast'
    case 'gen3a_turbo':
      return 'gen3a_turbo'
    case 'gen4_turbo':
    case 'runway-gen4':
    default:
      return 'gen4_turbo'
  }
}

function clampRunwayDuration(duration: number): 5 | 10 {
  return duration >= 8 ? 10 : 5
}

export interface RunwayVideoParams {
  prompt: string
  duration: number
  imageUrl?: string
  aspectRatio?: string
  onSubProgress?: SubProgressFn
}

export async function runwayVideo(
  model: ModelDef,
  params: RunwayVideoParams,
): Promise<string> {
  const RunwayML = (await import('@runwayml/sdk')).default
  const client = new RunwayML({ apiKey: runwayApiKey() })
  const runwayModel = resolveRunwayModel(model.falEndpoint)
  const ratio = mapAspectRatio(params.aspectRatio)
  const duration = clampRunwayDuration(params.duration)

  if (params.imageUrl) {
    const task = await client.imageToVideo.create({
      model: runwayModel,
      promptText: params.prompt,
      promptImage: params.imageUrl,
      duration,
      ratio,
    })
    return pollRunwayJob(client, task.id, params.onSubProgress)
  }

  const task = await client.textToVideo.create({
    model: runwayModel,
    promptText: params.prompt,
    duration,
    ratio,
  })
  return pollRunwayJob(client, task.id, params.onSubProgress)
}
