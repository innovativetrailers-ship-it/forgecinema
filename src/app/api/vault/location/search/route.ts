import { NextRequest, NextResponse } from 'next/server'
import { searchLocations } from '@/lib/location/mapillary'
import { buildGenerativeLocationPrompt } from '@/lib/location/osm'

export async function GET(request: NextRequest) {
  const userId = request.headers.get('x-user-id')
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')
  if (!q) return NextResponse.json({ error: 'q parameter required' }, { status: 400 })

  const [mapillaryResults, generativePrompt] = await Promise.allSettled([
    searchLocations({ description: q, maxResults: 12 }),
    buildGenerativeLocationPrompt(q),
  ])

  return NextResponse.json({
    mapillary: mapillaryResults.status === 'fulfilled' ? mapillaryResults.value : [],
    generativePrompt: generativePrompt.status === 'fulfilled' ? generativePrompt.value : q,
  })
}
