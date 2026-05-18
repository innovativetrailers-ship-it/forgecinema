const MAPILLARY_API = 'https://graph.mapillary.com'

export interface MapillaryImage {
  id: string
  lat: number
  lng: number
  imageUrl: string
  description: string
  capturedAt: string
  compassAngle?: number
}

export async function searchLocations(params: {
  description: string
  maxResults?: number
  bbox?: { west: number; south: number; east: number; north: number }
}): Promise<MapillaryImage[]> {
  const { description, maxResults = 10 } = params

  // Parse location keywords from description
  const keywords = description
    .split(/[,\s]+/)
    .filter((w) => w.length > 3)
    .slice(0, 3)
    .join(' ')

  const params_url = new URLSearchParams({
    fields: 'id,captured_at,geometry,thumb_1024_url,computed_compass_angle',
    limit: maxResults.toString(),
  })

  if (params.bbox) {
    params_url.set(
      'bbox',
      `${params.bbox.west},${params.bbox.south},${params.bbox.east},${params.bbox.north}`
    )
  }

  const res = await fetch(
    `${MAPILLARY_API}/images?${params_url.toString()}&access_token=${process.env.MAPILLARY_ACCESS_TOKEN}`,
    { headers: { 'Content-Type': 'application/json' } }
  )

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Mapillary API error ${res.status}: ${err}`)
  }

  interface MapillaryResponse {
    data: Array<{
      id: string
      captured_at: string
      geometry: { coordinates: [number, number] }
      thumb_1024_url: string
      computed_compass_angle?: number
    }>
  }

  const data = await res.json() as MapillaryResponse

  return data.data.map((img) => ({
    id: img.id,
    lat: img.geometry.coordinates[1],
    lng: img.geometry.coordinates[0],
    imageUrl: img.thumb_1024_url,
    description: keywords,
    capturedAt: img.captured_at,
    compassAngle: img.computed_compass_angle,
  }))
}

export async function getImageDetails(imageId: string): Promise<MapillaryImage | null> {
  const res = await fetch(
    `${MAPILLARY_API}/${imageId}?fields=id,captured_at,geometry,thumb_2048_url,computed_compass_angle&access_token=${process.env.MAPILLARY_ACCESS_TOKEN}`
  )

  if (!res.ok) return null

  interface MapillaryImageDetail {
    id: string
    captured_at: string
    geometry: { coordinates: [number, number] }
    thumb_2048_url: string
    computed_compass_angle?: number
  }

  const img = await res.json() as MapillaryImageDetail

  return {
    id: img.id,
    lat: img.geometry.coordinates[1],
    lng: img.geometry.coordinates[0],
    imageUrl: img.thumb_2048_url,
    description: '',
    capturedAt: img.captured_at,
    compassAngle: img.computed_compass_angle,
  }
}
