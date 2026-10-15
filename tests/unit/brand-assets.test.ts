import path from 'node:path'
import sharp from 'sharp'

const root = path.join(__dirname, '../..')

type Rgba = { data: Buffer; width: number; height: number; channels: number }

const load = async (rel: string): Promise<Rgba> => {
  const { data, info } = await sharp(path.join(root, rel)).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  return { data, width: info.width, height: info.height, channels: info.channels }
}

const pixel = (img: Rgba, x: number, y: number) => {
  const i = (y * img.width + x) * img.channels
  return [img.data[i], img.data[i + 1], img.data[i + 2], img.data[i + 3]]
}

const sat = (r: number, g: number, b: number) => Math.max(r, g, b) - Math.min(r, g, b)
const mean = (r: number, g: number, b: number) => (r + g + b) / 3

const edgePoints = (img: Rgba): Array<[number, number]> => {
  const x1 = img.width - 1
  const y1 = img.height - 1
  const mx = Math.floor(img.width / 2)
  const my = Math.floor(img.height / 2)
  return [
    [0, 0],
    [x1, 0],
    [0, y1],
    [x1, y1],
    [mx, 0],
    [mx, y1],
    [0, my],
    [x1, my],
  ]
}

/** Share of 16×16 blocks whose neutral-grey pixels jump to a different grey. */
export const checkerBlockRatio = (img: Rgba): number => {
  const block = 16
  const cols = Math.floor(img.width / block)
  const rows = Math.floor(img.height / block)
  let bad = 0
  for (let by = 0; by < rows; by++) {
    for (let bx = 0; bx < cols; bx++) {
      let jumps = 0
      let opaque = 0
      let grey = 0
      for (let y = 0; y < block; y++) {
        for (let x = 0; x < block; x++) {
          const X = bx * block + x
          const Y = by * block + y
          const [r, g, b, a] = pixel(img, X, Y)
          if (a < 200) continue
          opaque++
          if (sat(r, g, b) >= 12 || mean(r, g, b) < 90 || mean(r, g, b) > 200) continue
          grey++
          for (const [dx, dy] of [
            [1, 0],
            [0, 1],
          ] as const) {
            const nx = X + dx
            const ny = Y + dy
            if (nx >= img.width || ny >= img.height) continue
            const [nr, ng, nb, na] = pixel(img, nx, ny)
            if (na < 200 || sat(nr, ng, nb) >= 18) continue
            if (Math.abs(mean(nr, ng, nb) - mean(r, g, b)) > 45) jumps++
          }
        }
      }
      if (opaque > 8 && grey / opaque > 0.4 && jumps / opaque > 0.2) bad++
    }
  }
  return bad / (cols * rows)
}

const innerPlate = (img: Rgba) => {
  let minX = img.width
  let minY = img.height
  let maxX = 0
  let maxY = 0
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      if (pixel(img, x, y)[3] > 16) {
        if (x < minX) minX = x
        if (y < minY) minY = y
        if (x > maxX) maxX = x
        if (y > maxY) maxY = y
      }
    }
  }
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const rad = Math.min(maxX - minX, maxY - minY) / 2
  let low = 0
  let grey = 0
  const lums: number[] = []
  for (let y = 0; y < img.height; y += 2) {
    for (let x = 0; x < img.width; x += 2) {
      const r = Math.hypot(x - cx, y - cy) / rad
      if (r < 0.22 || r > 0.48) continue
      const [R, G, B, A] = pixel(img, x, y)
      if (A < 200 || sat(R, G, B) >= 12) continue
      low++
      const lum = mean(R, G, B)
      lums.push(lum)
      if (lum >= 90 && lum <= 200) grey++
    }
  }
  const avg = lums.reduce((sum, value) => sum + value, 0) / lums.length
  const sd = Math.sqrt(lums.reduce((sum, value) => sum + (value - avg) ** 2, 0) / lums.length)
  return { greyFrac: grey / low, sd, avg }
}

describe('brand assets', () => {
  const clear = ['public/brand/logo.png', 'public/brand/icon-32.png', 'public/brand/icon-180.png']
  const plated = ['public/icon-192.png', 'public/icon-512.png']

  test.each(clear)('%s is a square with a clear edge', async (rel) => {
    const img = await load(rel)
    expect(img.width).toBe(img.height)
    expect(img.width).toBeGreaterThan(0)
    for (const [x, y] of edgePoints(img)) {
      expect(pixel(img, x, y)[3]).toBe(0)
    }
    expect(pixel(img, Math.floor(img.width / 2), Math.floor(img.height / 2))[3]).toBe(255)
  })

  test.each(plated)('%s is a square on one solid plate', async (rel) => {
    const img = await load(rel)
    expect(img.width).toBe(img.height)
    const first = pixel(img, 0, 0)
    expect(first).toEqual([0x0d, 0x11, 0x17, 255])
    for (const [x, y] of edgePoints(img)) {
      expect(pixel(img, x, y)).toEqual(first)
    }
    expect(pixel(img, Math.floor(img.width / 2), Math.floor(img.height / 2))[3]).toBe(255)
  })

  test('the 1024 master has no checker and a charcoal inner plate', async () => {
    const img = await load('public/brand/logo.png')
    expect(img.width).toBe(1024)
    expect(img.height).toBe(1024)
    expect(checkerBlockRatio(img)).toBeLessThanOrEqual(0.005)
    const plate = innerPlate(img)
    expect(plate.greyFrac).toBeLessThan(0.02)
    expect(plate.sd).toBeLessThan(22)
    expect(plate.avg).toBeLessThan(40)
  })

  test('the archived checker file fails the same rule', async () => {
    const img = await load('docs/brand/logo-original-with-checker.png')
    const plate = innerPlate(img)
    expect(checkerBlockRatio(img) > 0.005 || plate.greyFrac >= 0.02 || plate.sd >= 22).toBe(true)
  })
})
