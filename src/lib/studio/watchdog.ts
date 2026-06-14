import { db } from '@/lib/db'

const STUCK_AFTER_MS = 15 * 60 * 1000

export async function sweepStuckShots(): Promise<number> {
  const cutoff = new Date(Date.now() - STUCK_AFTER_MS)
  const swept = await db.studioClip.updateMany({
    where: { status: 'GENERATING', generatingAt: { lt: cutoff } },
    data: { status: 'FAILED', generatingAt: null },
  })
  if (swept.count > 0) {
    console.warn('[watchdog] swept stuck shots:', swept.count)
  }
  return swept.count
}

export function startShotWatchdog(): () => void {
  void sweepStuckShots()
  const timer = setInterval(() => { void sweepStuckShots() }, 2 * 60 * 1000)
  return () => clearInterval(timer)
}
