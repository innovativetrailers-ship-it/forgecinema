import { expect, test, type Page } from '@playwright/test'
import { mkdir } from 'node:fs/promises'

const VIEWPORTS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
] as const

const ROUTES = ['/simple', '/advanced', '/ultimate'] as const
const PANEL_WIDTHS = new Set([1920, 1280, 1024])

test.beforeEach(({}, info) => {
  test.skip(info.project.name !== 'chromium', 'The viewport matrix runs once in chromium')
})

async function settle(page: Page) {
  await page.waitForFunction(() => document.documentElement.dataset.viewportReady === '1')
  await page.waitForTimeout(250)
}

async function outsideViewport(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const bad: string[] = []
    const nodes = document.querySelectorAll('button, a, input, textarea, select, [role="tab"]')
    for (const el of nodes) {
      const style = getComputedStyle(el)
      if (style.display === 'none' || style.visibility === 'hidden') continue
      const rect = el.getBoundingClientRect()
      if (rect.width < 2 || rect.height < 2) continue
      const outside = rect.right > vw + 1 || rect.left < -1 || rect.bottom > vh + 1 || rect.top < -1
      if (!outside) continue
      let node: HTMLElement | null = el.parentElement
      let inScroll = false
      while (node) {
        const parent = getComputedStyle(node)
        const scrollX = (parent.overflowX === 'auto' || parent.overflowX === 'scroll') && node.scrollWidth > node.clientWidth + 1
        const scrollY = (parent.overflowY === 'auto' || parent.overflowY === 'scroll') && node.scrollHeight > node.clientHeight + 1
        if (scrollX || scrollY) inScroll = true
        node = node.parentElement
      }
      if (inScroll) continue
      const tabs = el.closest('.dv-tabs-container')
      if (tabs && tabs.scrollWidth > tabs.clientWidth + 1) continue
      const label = (el.getAttribute('aria-label') || el.getAttribute('title') || el.textContent || el.tagName).trim().replace(/\s+/g, ' ').slice(0, 48)
      bad.push(label)
    }
    return bad
  })
}

async function generateIsClickable(page: Page) {
  const buttons = page.getByRole('button', { name: /^Generate( Video)?$/ })
  const count = await buttons.count()
  for (let index = 0; index < count; index += 1) {
    const button = buttons.nth(index)
    if (!(await button.isVisible())) continue
    const box = await button.boundingBox()
    if (!box || box.width < 2) continue
    const hit = await page.evaluate(({ x, y }) => {
      const el = document.elementFromPoint(x, y)
      const owner = el?.closest('button, a')
      return owner?.getAttribute('aria-label') || owner?.getAttribute('title') || owner?.textContent?.trim() || ''
    }, { x: box.x + box.width / 2, y: box.y + box.height / 2 })
    expect(hit).toMatch(/Generate/)
  }
}

async function cyclePanel(page: Page) {
  await page.waitForSelector('[data-side-panel]', { state: 'attached' })
  const open = page.getByRole('button', { name: 'Open panel' })
  if (await open.isVisible()) {
    await open.click()
    await page.waitForTimeout(300)
  }
  const monitor = page.locator('[data-program-monitor]')
  const opened = await monitor.boundingBox()
  const panel = await page.locator('[data-side-panel]').boundingBox()
  expect(opened).toBeTruthy()
  expect(panel && panel.width).toBeGreaterThan(40)
  await page.getByRole('button', { name: 'Close panel' }).first().click()
  await page.waitForTimeout(300)
  const closed = await monitor.boundingBox()
  expect(closed!.width).toBeGreaterThan(opened!.width + Math.max(40, (panel?.width ?? 0) * 0.6))
  await page.getByRole('button', { name: 'Open panel' }).click()
  await page.waitForTimeout(300)
  const reopened = await monitor.boundingBox()
  expect(reopened!.width).toBeLessThan(closed!.width - 40)
}

for (const route of ROUTES) {
  for (const viewport of VIEWPORTS) {
    test(`${route} ${viewport.width}x${viewport.height}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      await page.addInitScript(() => localStorage.removeItem('cinema-side-panel-open'))
      await page.goto(route)
      await settle(page)
      expect(page.url()).not.toContain('/login')
      const shotDir = 'docs/screens/responsive'
      await mkdir(shotDir, { recursive: true })
      await page.screenshot({
        path: `${shotDir}/${route.slice(1)}-${viewport.width}x${viewport.height}.png`,
      })

      if (viewport.width < 700 && route !== '/simple') {
        const mode = route === '/ultimate' ? 'Ultimate' : 'Advanced'
        await expect(page.getByText(`${mode} needs a wider screen.`)).toBeVisible()
        await expect(page.getByRole('link', { name: 'Open Simple mode' })).toHaveAttribute('href', '/simple')
      } else {
        await generateIsClickable(page)
      }

      if (route !== '/simple' && viewport.width >= 700 && PANEL_WIDTHS.has(viewport.width)) {
        await cyclePanel(page)
      }

      const outside = await outsideViewport(page)
      expect(outside, outside.join(' | ')).toEqual([])

      if (route !== '/simple' && viewport.width >= 700) {
        const monitor = await page.locator('[data-program-monitor]').boundingBox()
        expect(monitor!.width).toBeGreaterThanOrEqual(viewport.width * 0.4 - 2)
      }
    })
  }
}
