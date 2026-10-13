import { test, expect } from '@playwright/test'

test('generate waits for the balance before it can say insufficient', async ({ page }) => {
  await page.route('**/api/credits/balance', async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await route.continue()
  })
  await page.goto('/simple')
  await expect(page.getByText('Insufficient credits')).toHaveCount(0)
  const generate = page.getByRole('button', { name: /Generate Video/i })
  await expect(generate).toBeDisabled()
  await expect(page.getByText('Insufficient credits')).toHaveCount(0)
})
