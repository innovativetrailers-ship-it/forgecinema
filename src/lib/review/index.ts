export { notifyProjectOwner, type ReviewDecision } from './notify'

export async function resolveReviewVideoUrl(projectId: string): Promise<string | null> {
  const { db } = await import('@/lib/db')

  const exportJob = await db.renderJob.findFirst({
    where: {
      projectId,
      type: 'EXPORT',
      status: 'COMPLETE',
      outputUrl: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    select: { outputUrl: true, proxyUrl: true },
  })

  if (exportJob?.outputUrl) return exportJob.outputUrl
  if (exportJob?.proxyUrl) return exportJob.proxyUrl

  const generateJob = await db.renderJob.findFirst({
    where: {
      projectId,
      type: 'GENERATE',
      status: 'COMPLETE',
      outputUrl: { not: null },
    },
    orderBy: { completedAt: 'desc' },
    select: { outputUrl: true },
  })

  return generateJob?.outputUrl ?? null
}
