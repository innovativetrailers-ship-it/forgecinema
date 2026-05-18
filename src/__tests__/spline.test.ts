import { catmullRomSpline, computeHeading, computePitch } from '../lib/location/spline'

describe('catmullRomSpline', () => {
  it('returns input points unchanged when fewer than 2 points', () => {
    const pt = { x: 1, y: 2, z: 3 }
    expect(catmullRomSpline([pt])).toEqual([pt])
  })

  it('returns numSegments+1 points for exactly 2 input points', () => {
    const result = catmullRomSpline(
      [{ x: 0, y: 0, z: 0 }, { x: 10, y: 10, z: 10 }],
      0.5,
      10
    )
    expect(result).toHaveLength(11)
  })

  it('interpolated points lie within the bounding box of the control points', () => {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 5, y: 10, z: 0 },
      { x: 10, y: 0, z: 0 },
      { x: 15, y: 10, z: 0 },
    ]
    const result = catmullRomSpline(points, 0.5, 20)

    const minX = Math.min(...points.map((p) => p.x)) - 1
    const maxX = Math.max(...points.map((p) => p.x)) + 1

    for (const pt of result) {
      expect(pt.x).toBeGreaterThanOrEqual(minX)
      expect(pt.x).toBeLessThanOrEqual(maxX)
    }
  })

  it('produces smooth curve with more points as numSegments increases', () => {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 5, z: 2 },
      { x: 20, y: 0, z: 0 },
    ]
    const coarse = catmullRomSpline(points, 0.5, 5)
    const fine = catmullRomSpline(points, 0.5, 50)
    expect(fine.length).toBeGreaterThan(coarse.length)
  })

  it('starts near the first control point and ends near the last', () => {
    const points = [
      { x: 0, y: 0, z: 0 },
      { x: 10, y: 10, z: 0 },
      { x: 20, y: 0, z: 0 },
    ]
    const result = catmullRomSpline(points, 0.5, 20)
    const first = result[0]
    const last = result[result.length - 1]

    expect(Math.abs(first.x - points[0].x)).toBeLessThan(1)
    expect(Math.abs(last.x - points[points.length - 1].x)).toBeLessThan(1)
  })
})

describe('computeHeading', () => {
  it('returns 0 degrees for north (positive y)', () => {
    const h = computeHeading({ x: 0, y: 0, z: 0 }, { x: 0, y: 10, z: 0 })
    expect(Math.abs(h)).toBeLessThan(1) // ≈ 0°
  })

  it('returns 90 degrees for east (positive x)', () => {
    const h = computeHeading({ x: 0, y: 0, z: 0 }, { x: 10, y: 0, z: 0 })
    expect(Math.abs(h - 90)).toBeLessThan(1) // ≈ 90°
  })
})

describe('computePitch', () => {
  it('returns negative pitch when pointing upward (z decreases)', () => {
    const p = computePitch({ x: 0, y: 0, z: 100 }, { x: 0, y: 10, z: 50 })
    expect(p).toBeGreaterThan(0) // climbing down → positive pitch in screen space
  })

  it('returns 0 for level flight', () => {
    const p = computePitch({ x: 0, y: 0, z: 100 }, { x: 10, y: 0, z: 100 })
    expect(Math.abs(p)).toBeLessThan(1)
  })
})
