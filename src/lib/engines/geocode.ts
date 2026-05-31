// Convert address or GPS string → lat/lng
// Uses Nominatim (OpenStreetMap) — free, no API key required

export interface GeoLocation {
  lat:         number
  lng:         number
  displayName: string
  country:     string
  city:        string
  address:     string
}

// Parse GPS coordinate input: "-33.8688, 151.2093" or "33.8688°S 151.2093°E"
function parseGPSInput(input: string): { lat: number; lng: number } | null {
  // Decimal degrees: "-33.8688, 151.2093" or "-33.8688 151.2093"
  const decimalMatch = input.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/)
  if (decimalMatch) {
    return { lat: parseFloat(decimalMatch[1]), lng: parseFloat(decimalMatch[2]) }
  }

  // DMS format: "33°52'7.68"S 151°12'33.48"E"
  const dmsMatch = input.match(
    /(\d+)[°](\d+)['](\d+\.?\d*)["]([NS])\s*(\d+)[°](\d+)['](\d+\.?\d*)["]([EW])/i
  )
  if (dmsMatch) {
    const lat =
      (parseFloat(dmsMatch[1]) + parseFloat(dmsMatch[2]) / 60 + parseFloat(dmsMatch[3]) / 3600) *
      (dmsMatch[4].toUpperCase() === 'S' ? -1 : 1)
    const lng =
      (parseFloat(dmsMatch[5]) + parseFloat(dmsMatch[6]) / 60 + parseFloat(dmsMatch[7]) / 3600) *
      (dmsMatch[8].toUpperCase() === 'W' ? -1 : 1)
    return { lat, lng }
  }

  return null
}

interface NominatimResult {
  lat:         string
  lon:         string
  display_name: string
  address?: {
    country?: string
    city?:    string
    town?:    string
    village?: string
  }
}

export async function geocodeLocation(query: string): Promise<GeoLocation> {
  query = query.trim()

  const gps = parseGPSInput(query)
  if (gps) {
    // Reverse geocode to get display name
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${gps.lat}&lon=${gps.lng}&format=json`,
      { headers: { 'User-Agent': 'CinematicForge/1.0' } }
    )
    const data = await res.json() as NominatimResult
    return {
      lat:         gps.lat,
      lng:         gps.lng,
      displayName: data.display_name ?? `${gps.lat}, ${gps.lng}`,
      country:     data.address?.country ?? '',
      city:        data.address?.city ?? data.address?.town ?? data.address?.village ?? '',
      address:     data.display_name ?? '',
    }
  }

  // Text search via Nominatim
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&addressdetails=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'CinematicForge/1.0' } })
  const results = await res.json() as NominatimResult[]

  if (!results.length) {
    throw new Error(`Location not found: "${query}"`)
  }

  const r = results[0]
  return {
    lat:         parseFloat(r.lat),
    lng:         parseFloat(r.lon),
    displayName: r.display_name,
    country:     r.address?.country ?? '',
    city:        r.address?.city ?? r.address?.town ?? r.address?.village ?? '',
    address:     r.display_name,
  }
}
