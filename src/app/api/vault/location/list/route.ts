import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(req: NextRequest): Promise<NextResponse> {
  const userId = req.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const plates = await db.locationPlate.findMany({
    where:   { userId },
    orderBy: { createdAt: 'desc' },
    take:    100,
  })

  return NextResponse.json({ plates })
}
