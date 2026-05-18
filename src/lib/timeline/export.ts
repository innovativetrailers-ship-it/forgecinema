import { nanoid } from 'nanoid'
import type { TimelineRecipe, ExportSettings } from './schema'

export async function buildExportJob(
  recipe: TimelineRecipe,
  settings: ExportSettings,
  userId: string,
  projectId: string
): Promise<{ jobId: string }> {
  const { db } = await import('../db')
  const { exportQueue, getPriorityForRole } = await import('../queue')

  const user = await db.user.findUnique({ where: { id: userId }, select: { role: true } })
  const jobId = nanoid()

  await db.renderJob.create({
    data: {
      id: jobId,
      userId,
      projectId,
      type: 'EXPORT',
      status: 'QUEUED',
      inputPayload: { recipe: JSON.parse(JSON.stringify(recipe)), settings } as never,
      creditsCharged: getExportCost(settings.format),
    },
  })

  await exportQueue.add(
    'export',
    {
      jobId,
      userId,
      projectId,
      format: mapFormat(settings.format),
      timelineJson: recipe,
      resolution: `${settings.resolution.width}x${settings.resolution.height}`,
    },
    { priority: getPriorityForRole(user?.role ?? 'FREE') }
  )

  return { jobId }
}

function getExportCost(format: ExportSettings['format']): number {
  const costs: Record<string, number> = {
    mp4_h264: 8,
    mp4_h265: 10,
    prores_422: 20,
    prores_4444: 25,
    dcp: 40,
  }
  return costs[format] ?? 8
}

function mapFormat(format: ExportSettings['format']): string {
  const map: Record<string, string> = {
    mp4_h264: 'mp4_1080p',
    mp4_h265: 'mp4_4k',
    prores_422: 'prores_422',
    prores_4444: 'prores_4444',
    dcp: 'dcp',
  }
  return map[format] ?? 'mp4_1080p'
}
