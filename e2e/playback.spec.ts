import path from 'node:path'
import { test, expect } from '@playwright/test'

const fixture = path.join(__dirname, 'fixtures', 'playback-2s.mp4')

async function showTrack(page: import('@playwright/test').Page) {
  const cycle = page.getByTitle('Cycle timeline: full, compact, hidden')
  const track = page.locator('#track-row-t-v1')
  const hasCycle = await cycle.waitFor({ state: 'visible', timeout: 4_000 }).then(() => true).catch(() => false)
  if (!hasCycle) return
  for (let i = 0; i < 8; i += 1) {
    if ((await cycle.innerText()).includes('Full') && await track.count() > 0) return
    await cycle.click()
  }
}

async function placeAndPlay(page: import('@playwright/test').Page, mediaId: string, sourceUrl: string) {
  await page.route(`**/api/media/${mediaId}**`, (route) => {
    const url = route.request().url()
    if (url.includes('/stream')) {
      return route.fulfill({ path: fixture, contentType: 'video/mp4', headers: { 'Accept-Ranges': 'bytes' } })
    }
    return route.fulfill({ status: 302, headers: { Location: 'https://blocked.example/nope.mp4' } })
  })
  await page.route('**/api/studio/library?**', (route) => route.fulfill({
    json: {
      folders: [{ id: 'main', projectId: 'p', name: 'Main', parentId: null, kind: 'main', sceneId: null, order: 0 }],
      items: [{
        id: mediaId,
        kind: 'video',
        sourceUrl,
        folderId: 'main',
        label: 'Take',
        createdBy: 'generate',
        durationSec: 2,
      }],
    },
  }))
  await page.route('**/api/studio/library/compose**', (route) => route.fulfill({ json: { dialogue: false } }))
  const streamHit = page.waitForRequest((request) => request.url().includes(`/api/media/${mediaId}/stream`))
  await page.goto('/ultimate')
  await showTrack(page)
  await page.getByTitle('Library').click()
  await page.getByRole('button', { name: 'Media' }).click()
  const media = page.getByTestId('library-media').first()
  await expect(media).toBeVisible({ timeout: 20_000 })
  await showTrack(page)
  const track = page.locator('#track-row-t-v1')
  await expect(track).toBeVisible({ timeout: 20_000 })
  const from = await media.boundingBox()
  if (!from) throw new Error('drag source has no box')
  const drop = await track.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const y = rect.top + rect.height / 2
    for (let x = rect.left + 96; x < rect.right - 12; x += 8) {
      const hit = document.elementFromPoint(x, y)
      if (hit && el.contains(hit)) return { x, y }
    }
    return null
  })
  if (!drop) throw new Error('video track is covered')
  await page.mouse.move(from.x + 12, from.y + 12)
  await page.mouse.down()
  await page.mouse.move(drop.x, drop.y, { steps: 8 })
  await page.mouse.up()
  const clip = page.getByTestId('timeline-clip')
  await expect(clip).toHaveCount(1)
  await clip.dispatchEvent('click')
  const video = page.locator('video.preview-video')
  await expect(video).toBeVisible({ timeout: 15_000 })
  await streamHit
  await expect(page.getByText('Could not load media')).toHaveCount(0)
  await expect.poll(async () => video.evaluate((el) => (el as HTMLVideoElement).videoWidth).catch(() => 0), { timeout: 8_000 }).toBeGreaterThan(0)
  const before = await video.evaluate((el) => (el as HTMLVideoElement).currentTime)
  const timecode = page.getByTestId('program-timecode')
  const timecodeBefore = await timecode.innerText()
  await page.getByTitle('Play (Space)').click()
  await expect.poll(async () => video.evaluate((el) => (el as HTMLVideoElement).currentTime).catch(() => 0), { timeout: 8_000 }).toBeGreaterThan(before)
  await expect.poll(async () => timecode.innerText(), { timeout: 8_000 }).not.toBe(timecodeBefore)
  const frame = await video.evaluate((el) => {
    const node = el as HTMLVideoElement
    const canvas = document.createElement('canvas')
    canvas.width = node.videoWidth
    canvas.height = node.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx || node.videoWidth < 1) return 0
    ctx.drawImage(node, 0, 0)
    const pixel = ctx.getImageData(8, 8, 1, 1).data
    return pixel[0] + pixel[1] + pixel[2]
  })
  expect(frame).toBeGreaterThan(0)
  const width = await video.evaluate((el) => (el as HTMLVideoElement).videoWidth)
  expect(width).toBeGreaterThan(0)
  await expect(page.getByText('Could not load media')).toHaveCount(0)
}

test('a stored stream url plays a real frame', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'On a phone the library drawer covers the video track.')
  await placeAndPlay(page, 'lib_new', '/api/media/lib_new/stream')
})

test('a clip saved with the old media url plays through the stream route', async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'On a phone the library drawer covers the video track.')
  await placeAndPlay(page, 'lib_old', '/api/media/lib_old')
})
