import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth/requireUser'
import { configuredStockSources, STOCK_SOURCE_ENV } from '@/lib/stock/sources'

export async function GET(req: Request) {
  const userId = (await requireUser(req))?.id ?? null
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const configured = configuredStockSources()
  const missing = (Object.keys(STOCK_SOURCE_ENV) as Array<keyof typeof STOCK_SOURCE_ENV>)
    .filter((id) => !configured.includes(id))
    .map((id) => STOCK_SOURCE_ENV[id])
  return NextResponse.json({ configured, missing })
}
