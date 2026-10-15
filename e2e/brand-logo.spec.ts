import { mkdirSync } from 'node:fs'
import path from 'node:path'
import { expect, test, type Page } from '@playwright/test'
import sharp from 'sharp'

const shotDir = path.join(process.cwd(), 'docs/screens/brand')

const viewports = [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
] as const

const sample = async (png: Buffer, x: number, y: number) => {
  const { data, info } = await sharp(png).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const cx = Math.max(0, Math.min(info.width - 1, Math.round(x)))
  const cy = Math.max(0, Math.min(info.height - 1, Math.round(y)))
  const i = (cy * info.width + cx) * info.channels
  return [data[i], data[i + 1], data[i + 2]] as const
}

const close = (a: readonly number[], b: readonly number[]) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]) < 36

const assertLogoSitsOnBackground = async (page: Page) => {
  const img = page.locator('img[alt="Cinematic Forge"]').first()
  await expect(img).toBeVisible()
  const box = await img.boundingBox()
  expect(box).toBeTruthy()
  if (!box) return
  const scale = await page.evaluate(() => window.devicePixelRatio || 1)
  const png = await page.screenshot()
  const inset = 3 * scale
  const corners = [
    [box.x * scale + inset, box.y * scale + inset],
    [(box.x + box.width) * scale - inset, box.y * scale + inset],
    [box.x * scale + inset, (box.y + box.height) * scale - inset],
    [(box.x + box.width) * scale - inset, (box.y + box.height) * scale - inset],
  ]
  const outside = await sample(png, (box.x + box.width / 2) * scale, Math.max(0, box.y * scale - 6 * scale))
  for (const [x, y] of corners) {
    const px = await sample(png, x, y)
    expect(close(px, outside)).toBe(true)
    const sat = Math.max(...px) - Math.min(...px)
    const mean = (px[0] + px[1] + px[2]) / 3
    expect(sat < 12 && mean >= 90 && mean <= 200).toBe(false)
  }
  const cx = (box.x + box.width / 2) * scale
  const cy = (box.y + box.height / 2) * scale
  const ring = box.width * 0.34 * scale
  const plate: number[][] = []
  for (const deg of [20, 80, 150, 210, 280, 340]) {
    const rad = (deg * Math.PI) / 180
    plate.push(await sample(png, cx + Math.cos(rad) * ring, cy + Math.sin(rad) * ring))
  }
  for (const px of plate) {
    const sat = Math.max(...px) - Math.min(...px)
    const mean = (px[0] + px[1] + px[2]) / 3
    expect(sat < 12 && mean >= 140 && mean <= 255).toBe(false)
  }
}

test.describe('brand logo', () => {
  for (const viewport of viewports) {
    test(`header and sign-in at ${viewport.width}x${viewport.height}`, async ({ page, browser }) => {
      mkdirSync(shotDir, { recursive: true })
      const tag = `${viewport.width}x${viewport.height}`
      await page.setViewportSize({ ...viewport })
      await page.goto('/simple')
      await assertLogoSitsOnBackground(page)
      const header = page.locator('img[alt="Cinematic Forge"]').first()
      await header.screenshot({ path: path.join(shotDir, `header-${tag}.png`) })

      const loggedOut = await browser.newContext({
        viewport: { ...viewport },
        storageState: { cookies: [], origins: [] },
      })
      const signedOut = await loggedOut.newPage()
      await signedOut.goto('/login')
      await assertLogoSitsOnBackground(signedOut)
      const signIn = signedOut.locator('img[alt="Cinematic Forge"]').first()
      await signIn.screenshot({ path: path.join(shotDir, `signin-${tag}.png`) })
      await loggedOut.close()
    })
  }
})
