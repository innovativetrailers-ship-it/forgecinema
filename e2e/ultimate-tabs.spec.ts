import { test, expect } from '@playwright/test'

for (const width of [800, 1024, 1440]) {
  test(`workspace tabs at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.goto('/ultimate')
    const list = page.getByRole('tablist', { name: 'Ultimate workspaces' })
    await expect(list).toBeVisible()
    await page.getByRole('tab', { name: 'Colour Grade · layout' }).click()
    await expect(page.getByTestId('layout-preset')).toBeVisible()
    const green = page.getByRole('tab', { name: 'Green Screen' })
    await green.click()
    await green.focus()
    await expect(page.getByText('Green Screen').first()).toBeVisible()
    await page.keyboard.press('ArrowLeft')
    await expect(page.getByRole('tab', { name: 'Audio Mix' })).toBeFocused()
  })
}
