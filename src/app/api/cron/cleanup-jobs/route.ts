import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { renderQueue, trainingQueue, exportQueue } from '@/lib/queue'

export const runtime = 'nodejs'

// Vercel cron authentication
function verifyCronAuth(req: NextRequest): boolean {
  return req.headers.get('Authorization') === `Bearer ${process.env.CRON_SECRET}`
}

export async function GET(req: NextRequest) {
  if (!verifyCronAuth(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago

  try {
    // Clean completed/failed jobs from BullMQ (keep last 100)
    await Promise.all([
      renderQueue.clean(7 * 24 * 3600 * 1000, 100, 'completed'),
      renderQueue.clean(7 * 24 * 3600 * 1000, 50, 'failed'),
      trainingQueue.clean(7 * 24 * 3600 * 1000, 50, 'completed'),
      exportQueue.clean(7 * 24 * 3600 * 1000, 50, 'completed'),
    ])

    // Archive old DB jobs
    const { count } = await db.renderJob.updateMany({
      where: {
        status: { in: ['COMPLETE', 'FAILED', 'CANCELLED'] },
        updatedAt: { lt: cutoff },
      },
      data: { status: 'CANCELLED' },
    })

    // Clean up API usage logs older than 30 days
    const logCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const { count: logCount } = await db.apiUsageLog.deleteMany({
      where: { createdAt: { lt: logCutoff } },
    })

    return NextResponse.json({
      ok: true,
      archived: count,
      logsDeleted: logCount,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[cron/cleanup-jobs]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
