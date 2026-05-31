const MAPILLARY_BASE = 'https://graph.mapillary.com'

// ─── Shared types ──────────────────────────────────────────────────────────────

export interface MapillarySearchParams {
  lat:     number
  lng:     number
  radius?: number
  limit?:  number
}

export interface MapillaryImage {
  id:           string
  thumbUrl:     string
  fullUrl:      string
  capturedAt:   string
  lat:          number
  lng:          number
  compassAngle?: number
}

interface RawMapillaryImage {
  id:              string
  thumb_1024_url?: string
  thumb_2048_url?: string
  captured_at?:    string
  geometry?:       { coordinates?: [number, number] }
  compass_angle?:  number
}

// ─── searchStreetView (used by /api/location/search) ──────────────────────────

export async function searchStreetView(params: {
  lat:     number
  lng:     number
  radius?: number
  limit?:  number
}): Promise<MapillaryImage[]> {
  const radius = params.radius ?? 150
  const limit  = params.limit  ?? 20

  // Build bounding box from radius in metres
  const degOffset = radius / 111320
  const bbox = [
    params.lng - degOffset,
    params.lat - degOffset,
    params.lng + degOffset,
    params.lat + degOffset,
  ].join(',')

  const url = `${MAPILLARY_BASE}/images?` + new URLSearchParams({
    access_token: process.env.MAPILLARY_ACCESS_TOKEN!,
    fields:       'id,thumb_1024_url,thumb_2048_url,captured_at,geometry,compass_angle',
    bbox,
    limit:        String(limit),
  })

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Mapillary search failed: ${await res.text()}`)
  const data = await res.json() as { data?: RawMapillaryImage[] }

  return (data.data ?? []).map((img) => ({
    id:           img.id,
    thumbUrl:     img.thumb_1024_url ?? '',
    fullUrl:      img.thumb_2048_url ?? img.thumb_1024_url ?? '',
    capturedAt:   img.captured_at ?? '',
    lat:          img.geometry?.coordinates?.[1] ?? params.lat,
    lng:          img.geometry?.coordinates?.[0] ?? params.lng,
    compassAngle: img.compass_angle,
  }))
}

// ─── searchLocationImagery (legacy — kept for /api/location/imagery) ──────────

export async function searchLocationImagery(
  params: MapillarySearchParams
): Promise<Array<{ id: string; thumbUrl: string; capturedAt: string; lat: number; lng: number }>> {
  const token  = process.env.MAPILLARY_ACCESS_TOKEN!
  const radius = params.radius ?? 100
  const delta  = radius / 111000

  const bbox = [
    params.lng - delta, params.lat - delta,
    params.lng + delta, params.lat + delta,
  ].join(',')

  const url =
    `${MAPILLARY_BASE}/images?` +
    `access_token=${token}&` +
    `fields=id,thumb_2048_url,captured_at,geometry&` +
    `bbox=${bbox}&` +
    `limit=${params.limit ?? 10}`

  const res  = await fetch(url)
  if (!res.ok) throw new Error(`Mapillary error: ${await res.text()}`)
  const data = await res.json() as { data?: RawMapillaryImage[] }

  return (data.data ?? []).map((img) => ({
    id:         img.id,
    thumbUrl:   img.thumb_2048_url ?? '',
    capturedAt: img.captured_at ?? '',
    lat:        img.geometry?.coordinates?.[1] ?? params.lat,
    lng:        img.geometry?.coordinates?.[0] ?? params.lng,
  }))
}
