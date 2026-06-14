import { NextRequest, NextResponse } from 'next/server'
import { denyUnlessCron } from '@/lib/cron-guard'
import { endpointDrift } from '@/lib/fal/schemaSync'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const denied = denyUnlessCron(req)
  if (denied) return denied

  try {
    const rows = await endpointDrift()
    const problems = rows.filter((r) => r.status !== 'ok')

    return NextResponse.json({
      ok: problems.length === 0,
      probed: rows.length,
      problems,
      rows,
      timestamp: new Date().toISOString(),
    }, { status: problems.length ? 503 : 200 })
  } catch (err) {
    console.error('[cron/endpoint-drift]', err)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
