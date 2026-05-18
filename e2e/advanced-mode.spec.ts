import { test, expect } from '@playwright/test'

test.describe('Advanced Mode — /advanced', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/advanced')
    await page.waitForLoadState('networkidle')
  })

  test('renders the editor shell', async ({ page }) => {
    await expect(page.locator('body')).toBeVisible()
    // Should have the "Advanced" label somewhere
    await expect(page.getByText(/advanced/i).first()).toBeVisible()
  })

  test('timeline container is present', async ({ page }) => {
    // The timeline should render track rows
    // Look for track labels like VIDEO 1, MUSIC etc.
    const trackLabel = page.locator('text=/VIDEO|MUSIC|VOICE|SFX/i').first()
    await expect(trackLabel).toBeVisible({ timeout: 8_000 })
  })

  test('left icon bar is present', async ({ page }) => {
    // Icon bar with tool buttons
    const iconBar = page.locator('[title*="Select"], [title*="Razor"], [title*="Repaint"]').first()
    await expect(iconBar).toBeVisible({ timeout: 5_000 })
  })

  test('video preview area is present', async ({ page }) => {
    // Preview should show "No content at playhead" or similar
    const preview = page.locator('text=/No content|playhead/i').first()
    await expect(preview).toBeVisible({ timeout: 5_000 })
  })

  test('generate panel is accessible', async ({ page }) => {
    // The Generate panel should be open by default (✨ icon)
    const generatePanel = page.locator('text=/Generate|Describe shot/i').first()
    await expect(generatePanel).toBeVisible({ timeout: 5_000 })
  })

  test('keyboard shortcut Space does not crash', async ({ page }) => {
    await page.keyboard.press('Space')
    // Page should still be functional
    await expect(page.locator('body')).toBeVisible()
  })

  test('export button is present', async ({ page }) => {
    const exportBtn = page.locator('button').filter({ hasText: /export/i }).first()
    await expect(exportBtn).toBeVisible()
  })

  test('undo/redo buttons are present', async ({ page }) => {
    await expect(page.locator('button[title*="Undo"]').or(page.locator('[title="Undo (⌘Z)"]')).first()).toBeVisible()
    await expect(page.locator('button[title*="Redo"]').or(page.locator('[title="Redo (⌘⇧Z)"]')).first()).toBeVisible()
  })
})

test.describe('Ultimate Mode — /ultimate', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ultimate')
    await page.waitForLoadState('networkidle')
  })

  test('renders the Ultimate studio shell', async ({ page }) => {
    await expect(page.getByText(/ultimate/i).first()).toBeVisible()
  })

  test('Script tab is the default active tab', async ({ page }) => {
    // Script editor textarea should be visible
    await expect(page.locator('textarea').first()).toBeVisible({ timeout: 8_000 })
  })

  test('can switch to Storyboard tab', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /storyboard/i }).first()
    await tab.click()
    await expect(page.locator('text=/storyboard|shots|scenes/i').first()).toBeVisible({ timeout: 5_000 })
  })

  test('can switch to AI Director tab', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /director|ai director/i }).first()
    await tab.click()
    await expect(page.locator('text=/director|council|style/i').first()).toBeVisible({ timeout: 5_000 })
  })

  test('can switch to Continuity tab', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /continuity/i }).first()
    await tab.click()
    await expect(page.locator('text=/continuity|check/i').first()).toBeVisible({ timeout: 5_000 })
  })

  test('can switch to Audio Mix tab', async ({ page }) => {
    const tab = page.locator('button').filter({ hasText: /audio/i }).first()
    await tab.click()
    await expect(page.locator('text=/music|audio|fader|mix/i').first()).toBeVisible({ timeout: 5_000 })
  })

  test('timeline tracks are present', async ({ page }) => {
    const trackLabel = page.locator('text=/VIDEO|MUSIC|VOICE/i').first()
    await expect(trackLabel).toBeVisible({ timeout: 8_000 })
  })
})
