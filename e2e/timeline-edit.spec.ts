import { test, expect } from '@playwright/test'

const libraryBody = {
  folders: [{ id: 'main', projectId: 'p', name: 'Main', parentId: null, kind: 'main', sceneId: null, order: 0 }],
  items: [{
    id: 'take1',
    kind: 'video',
    sourceUrl: '/api/media/take1/stream',
    folderId: 'main',
    label: 'Take',
    createdBy: 'generate',
    durationSec: 5,
  }],
}

for (const editorPath of ['/ultimate', '/advanced']) {
test(`drag on ${editorPath}, keep the drop position, and select the clip`, async ({ page, browserName }) => {
  test.skip(browserName === 'webkit', 'On a phone the library drawer covers the video track.')
  await page.route('**/api/studio/library?**', (route) => route.fulfill({ json: libraryBody }))
  await page.route('**/api/studio/library/compose**', (route) => route.fulfill({ json: { dialogue: false } }))
  await page.goto(editorPath)
  const cycle = page.getByTitle('Cycle timeline: full, compact, hidden')
  const track = page.locator('#track-row-t-v1')
  const hasCycle = await cycle.waitFor({ state: 'visible', timeout: 4_000 }).then(() => true).catch(() => false)
  async function showTrack() {
    if (!hasCycle) return
    for (let i = 0; i < 8; i += 1) {
      if ((await cycle.innerText()).includes('Full') && await track.count() > 0) return
      await cycle.click()
    }
  }
  await showTrack()
  await page.getByTitle('Library').click()
  await page.getByRole('button', { name: 'Media' }).click()
  const media = page.getByTestId('library-media').first()
  await expect(media).toBeVisible({ timeout: 20_000 })
  await showTrack()
  await expect(track).toBeVisible({ timeout: 20_000 })
  const from = await media.boundingBox()
  if (!from) throw new Error('drag source has no box')
  const drop = await track.evaluate((el) => {
    const rect = el.getBoundingClientRect()
    const y = rect.top + rect.height / 2
    for (let x = rect.right - 12; x > rect.left + 80; x -= 8) {
      const hit = document.elementFromPoint(x, y)
      if (hit && el.contains(hit)) return { x, y }
    }
    return null
  })
  if (!drop) throw new Error('video track is covered')
  await page.mouse.move(from.x + 12, from.y + 12)
  await page.mouse.down()
  await page.mouse.move(from.x + 30, from.y + 8, { steps: 3 })
  await page.mouse.move(drop.x, drop.y, { steps: 6 })
  await page.mouse.up()
  const clip = page.getByTestId('timeline-clip')
  await expect(clip).toHaveCount(1)
  const start = await clip.getAttribute('data-start')
  expect(Number(start)).toBeGreaterThan(0)
  if (hasCycle) {
    await cycle.click()
    await cycle.click()
    await cycle.click()
    await expect(clip).toHaveAttribute('data-start', start!)
  }
  await clip.dispatchEvent('click')
  await expect(page.getByTestId('clip-properties')).toBeVisible()
  await expect(page.getByText('Select a clip')).toHaveCount(0)
})
}
