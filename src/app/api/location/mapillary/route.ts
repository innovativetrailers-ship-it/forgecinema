import { NextRequest, NextResponse } from 'next/server'
import { searchLocations } from '@/lib/location/mapillary'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'q required' }, { status: 400 })

  const results = await searchLocations({ description: q, maxResults: 20 })
  return NextResponse.json(results)
}
