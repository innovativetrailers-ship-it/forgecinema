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
      const url = task.output?.[0]
      if (!url) throw new Error('Runway returned no video URL')
      return url
    } else if (task.status === 'FAILED') {
      throw new Error(`Runway failed: ${task.failure ?? 'unknown'}`)
    }
  }
  throw new Error('Runway timed out after 15 min')
}

type RunwayRatio = '1280:720' | '720:1280' | '960:960'

function mapAspectRatio(aspectRatio?: string): RunwayRatio {
  if (aspectRatio === '9:16' || aspectRatio === '720:1280') return '720:1280'
  if (aspectRatio === '1:1' || aspectRatio === '960:960') return '960:960'
  return '1280:720'
}

function clampRunwayDuration(duration: number): number {
  return Math.min(10, Math.max(2, Math.round(duration)))
}

function useGen45(endpoint: string | undefined): boolean {
  return endpoint === 'gen4.5' || endpoint === 'runway-gen4.5'
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
  const ratio = mapAspectRatio(params.aspectRatio)
  const duration = clampRunwayDuration(params.duration)
  const gen45 = useGen45(model.falEndpoint)

  if (params.imageUrl) {
    const task = gen45
      ? await client.imageToVideo.create({
          model: 'gen4.5',
          promptText: params.prompt,
          promptImage: params.imageUrl,
          duration,
          ratio,
        })
      : await client.imageToVideo.create({
          model: 'gen4_turbo',
          promptText: params.prompt,
          promptImage: params.imageUrl,
          duration,
          ratio,
        })
    return pollRunwayJob(client, task.id, params.onSubProgress)
  }

  const task = gen45
    ? await client.textToVideo.create({
        model: 'gen4.5',
        promptText: params.prompt,
        duration,
        ratio: ratio === '960:960' ? '1280:720' : ratio,
      })
    : await client.textToVideo.create({
        model: 'gen4.5',
        promptText: params.prompt,
        duration,
        ratio: ratio === '960:960' ? '1280:720' : ratio,
      })
  return pollRunwayJob(client, task.id, params.onSubProgress)
}
