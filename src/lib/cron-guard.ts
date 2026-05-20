import { NextRequest, NextResponse } from 'next/server'

/** Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. */
export function denyUnlessCron(req: NextRequest): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 503 })
  }
  if (req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}
