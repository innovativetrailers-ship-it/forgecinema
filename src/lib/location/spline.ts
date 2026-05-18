interface Point3D {
  x: number
  y: number
  z: number
}

function catmullRomPoint(
  p0: Point3D,
  p1: Point3D,
  p2: Point3D,
  p3: Point3D,
  t: number,
  tension: number = 0.5
): Point3D {
  const t2 = t * t
  const t3 = t2 * t

  const alpha = tension

  return {
    x:
      alpha * ((-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3 +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + p2.x) * t) +
      p1.x,
    y:
      alpha * ((-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3 +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + p2.y) * t) +
      p1.y,
    z:
      alpha * ((-p0.z + 3 * p1.z - 3 * p2.z + p3.z) * t3 +
        (2 * p0.z - 5 * p1.z + 4 * p2.z - p3.z) * t2 +
        (-p0.z + p2.z) * t) +
      p1.z,
  }
}

export function catmullRomSpline(
  points: Point3D[],
  tension: number = 0.5,
  numSegments: number = 20
): Point3D[] {
  if (points.length < 2) return points
  if (points.length === 2) {
    // Linear interpolation for exactly 2 points
    return Array.from({ length: numSegments + 1 }, (_, i) => {
      const t = i / numSegments
      return {
        x: points[0].x + (points[1].x - points[0].x) * t,
        y: points[0].y + (points[1].y - points[0].y) * t,
        z: points[0].z + (points[1].z - points[0].z) * t,
      }
    })
  }

  // Extend the points array with phantom endpoints
  const extended = [
    { x: 2 * points[0].x - points[1].x, y: 2 * points[0].y - points[1].y, z: 2 * points[0].z - points[1].z },
    ...points,
    { x: 2 * points[points.length - 1].x - points[points.length - 2].x, y: 2 * points[points.length - 1].y - points[points.length - 2].y, z: 2 * points[points.length - 1].z - points[points.length - 2].z },
  ]

  const result: Point3D[] = []

  for (let i = 1; i < extended.length - 2; i++) {
    for (let j = 0; j <= numSegments; j++) {
      const t = j / numSegments
      result.push(catmullRomPoint(extended[i - 1], extended[i], extended[i + 1], extended[i + 2], t, tension))
    }
  }

  return result
}

export function computeHeading(from: Point3D, to: Point3D): number {
  const dx = to.x - from.x
  const dy = to.y - from.y
  return (Math.atan2(dx, dy) * 180) / Math.PI
}

export function computePitch(from: Point3D, to: Point3D): number {
  const dx = to.x - from.x
  const dy = to.y - from.y
  const dz = to.z - from.z
  const horizontalDist = Math.sqrt(dx * dx + dy * dy)
  return (Math.atan2(-dz, horizontalDist) * 180) / Math.PI
}
