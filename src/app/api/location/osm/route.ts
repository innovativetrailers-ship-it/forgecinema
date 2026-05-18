import { NextRequest, NextResponse } from 'next/server'
import { buildGenerativeLocationPrompt, getLocationMetadata } from '@/lib/location/osm'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')
  const lat = request.nextUrl.searchParams.get('lat')
  const lng = request.nextUrl.searchParams.get('lng')

  if (lat && lng) {
    const metadata = await getLocationMetadata(parseFloat(lat), parseFloat(lng))
    return NextResponse.json(metadata)
  }

  if (!q) return NextResponse.json({ error: 'q or lat/lng required' }, { status: 400 })

  const prompt = await buildGenerativeLocationPrompt(q)
  return NextResponse.json({ prompt })
}
