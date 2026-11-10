import { expect, test } from '@playwright/test'

test('the home page loads with the right title', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Hai Son Nguyen')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hai Son Nguyen')
})
