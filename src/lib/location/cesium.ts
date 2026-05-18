import { catmullRomSpline, computeHeading, computePitch } from './spline'

const CESIUM_ION_API = 'https://api.cesium.com/v1'

export interface CameraKeyframe {
  lat: number
  lng: number
  alt: number
  heading: number
  pitch: number
}

export interface AerialPathResult {
  cameraPath: CameraKeyframe[]
  basePlateVideoUrl: string
}

export async function buildAerialPath(params: {
  waypoints: Array<{ lat: number; lng: number }>
  altitudeMeters: number
  gimbalTarget?: { lat: number; lng: number }
}): Promise<AerialPathResult> {
  const { waypoints, altitudeMeters, gimbalTarget } = params

  // Convert waypoints to 3D points for spline interpolation
  const points3D = waypoints.map((wp) => ({
    x: wp.lng,
    y: wp.lat,
    z: altitudeMeters,
  }))

  const splinePoints = catmullRomSpline(points3D, 0.5, 30)

  // Convert spline back to camera keyframes
  const cameraPath: CameraKeyframe[] = splinePoints.map((pt, i) => {
    const next = splinePoints[i + 1] ?? splinePoints[i]

    let heading: number
    let pitch: number

    if (gimbalTarget) {
      // Point at the gimbal target
      const dx = gimbalTarget.lng - pt.x
      const dy = gimbalTarget.lat - pt.y
      heading = (Math.atan2(dx, dy) * 180) / Math.PI
      pitch = -45 // Angled down toward target
    } else {
      heading = computeHeading(pt, next)
      pitch = computePitch(pt, next)
    }

    return {
      lat: pt.y,
      lng: pt.x,
      alt: pt.z,
      heading,
      pitch,
    }
  })

  // Generate Cesium-rendered flythrough
  const basePlateVideoUrl = await renderCesiumFlythrough(cameraPath)

  return { cameraPath, basePlateVideoUrl }
}

async function renderCesiumFlythrough(
  cameraPath: CameraKeyframe[]
): Promise<string> {
  // Cesium Ion doesn't directly export video via API — we use their tiling endpoint
  // to get terrain data and compose with a render request
  const token = process.env.CESIUM_ION_ACCESS_TOKEN

  if (!token) {
    // Return a placeholder for development
    return ''
  }

  // Validate token with Cesium Ion
  const res = await fetch(`${CESIUM_ION_API}/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    return ''
  }

  // Build camera path for Cesium Scene
  // In production, this would use the Cesium ion SDK to render the path
  // For now, return the camera path as a JSON URL that can be consumed by the frontend
  const pathData = JSON.stringify({ cameraPath, type: 'cesium-flythrough' })
  const pathBuffer = Buffer.from(pathData)

  const { uploadToR2 } = await import('../storage/r2')
  const { nanoid } = await import('nanoid')
  const key = `location/cesium-paths/${nanoid()}.json`

  return uploadToR2(pathBuffer, key, 'application/json')
}
