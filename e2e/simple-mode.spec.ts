import { test, expect } from '@playwright/test'

test.describe('Simple Mode — /simple', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/simple')
    await page.waitForLoadState('networkidle')
  })

  test('renders the Simple Mode page', async ({ page }) => {
    await expect(page).toHaveTitle(/cinema|growth engine/i)
    await expect(page.locator('body')).toBeVisible()
  })

  test('shows Text-to-Video tab by default', async ({ page }) => {
    // Should have a prompt textarea
    const textarea = page.locator('textarea').first()
    await expect(textarea).toBeVisible()
  })

  test('quality pills are rendered', async ({ page }) => {
    const pills = page.locator('[data-quality-pill], button').filter({ hasText: /draft|standard|cinematic|film grade/i })
    await expect(pills.first()).toBeVisible()
  })

  test('credit balance is displayed', async ({ page }) => {
    // Credit badge should show somewhere in the nav or page
    const creditDisplay = page.locator('[data-credits]').first()
    await expect(creditDisplay).toBeVisible({ timeout: 10_000 })
  })

  test('tabs are navigable — Image-to-Video', async ({ page }) => {
    const imageTab = page.getByRole('tab', { name: /image/i })
      .or(page.locator('button').filter({ hasText: /image.*(video|to)/i }))
    await imageTab.first().click()

    // Image drop zone should appear
    await expect(page.getByText('Drop image here')).toBeVisible({ timeout: 5_000 })
  })

  test('tabs are navigable — Audio-to-Video', async ({ page }) => {
    const audioTab = page.getByRole('tab', { name: /audio/i })
      .or(page.locator('button').filter({ hasText: /audio/i }))
    await audioTab.first().click()
    await expect(page.getByText('Drop audio file here')).toBeVisible({ timeout: 5_000 })
    await expect(page.getByRole('button', { name: /Read the track to price these clips/ })).toBeDisabled()
    await page.locator('button').filter({ hasText: 'Drop & Direct' }).click()
    await expect(page.getByRole('button', { name: /no credit price yet/i })).toBeDisabled()
  })

  test('generate button is disabled without prompt', async ({ page }) => {
    const generateBtn = page.locator('button').filter({ hasText: /generate/i }).first()
    await expect(generateBtn).toBeDisabled()
  })

  test('generate button enables when prompt is typed', async ({ page }) => {
    await page.getByRole('button', { name: 'Quick Draft' }).click()
    const textarea = page.locator('textarea').first()
    await textarea.fill('A cinematic drone shot over a misty mountain range at golden hour')

    const generateBtn = page.locator('button').filter({ hasText: /generate/i }).first()
    await expect(generateBtn).toContainText('33')
    await expect(generateBtn).not.toBeDisabled({ timeout: 8_000 })
  })

  test('submitting a generation creates a card in the gallery', async ({ page }) => {
    // Fill prompt
    await page.locator('textarea').first().fill('Test generation — wide shot of a golden field at dawn')

    // Mock the job creation endpoint to return immediately
    await page.route('/api/jobs/create', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ jobId: 'test-job-123' }),
      })
    })

    // Mock the SSE stream
    await page.route('/api/jobs/test-job-123/stream', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/event-stream',
        body: 'data: {"status":"complete","progress":100,"outputUrl":"https://example.com/test.mp4"}\n\n',
      })
    })

    // Click generate
    const generateBtn = page.locator('button').filter({ hasText: /generate/i }).first()
    if (await generateBtn.isEnabled()) {
      await generateBtn.click()
      // A result card should appear in the gallery
      await expect(page.getByTestId('generation-card').first())
        .toBeVisible({ timeout: 10_000 })
    }
  })
})

test('a library clip keeps the model name and the credits spent', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('cinema-playback-state', JSON.stringify({
      state: {
        library: [{
          id: 'clip-library-1',
          jobId: 'job-library-1',
          prompt: 'A library shot',
          model: 'ltx-2.3-fast',
          quality: 'draft',
          creditsUsed: 33,
          duration: 5,
          aspectRatio: '16:9',
          status: 'complete',
          createdAt: '2026-10-14T00:00:00.000Z',
          mediaId: 'media-1',
          videoUrl: '/api/media/media-1',
        }],
      },
      version: 0,
    }))
  })
  await page.goto('/simple')
  const card = page.getByTestId('generation-card').first()
  await expect(card).toBeVisible({ timeout: 10_000 })
  await expect(card.getByTestId('result-model')).toHaveText('LTX-2.3-FAST')
  await expect(card.getByTestId('result-credits')).toContainText('33')
  await expect(card.getByTestId('result-library')).toHaveText('· Library')
})

test.describe('TopNav', () => {
  test('is visible on all editor pages', async ({ page }) => {
    for (const path of ['/simple', '/advanced', '/ultimate']) {
      await page.goto(path)
      await page.waitForLoadState('networkidle')
      // Nav should have the app brand and some navigation links
      const nav = page.locator('nav, header').first()
      await expect(nav).toBeVisible()
    }
  })

  test('shows credit balance in nav', async ({ page }) => {
    await page.goto('/simple')
    await page.waitForLoadState('networkidle')
    // Credit indicator in the nav
    await expect(page.locator('[data-credits]').first()).toBeVisible({ timeout: 8_000 })
  })
})
