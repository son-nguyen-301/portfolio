// The contact page (PF-019, docs/design/Contact.dc.html). The contact block
// itself is tested in contact-block.spec.ts. Run `pnpm generate` first.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const profile = parse(readFileSync(fileURLToPath(new URL('../../content/profile.yml', import.meta.url)), 'utf8')) as {
  email: string
  booking: { url: string, label: string }
  links: { upwork: string }
  hours: { label: string }
  replyPromise: string
  pricing: string
}

const phone = { width: 360, height: 740 }
const desktop = { width: 1280, height: 800 }

const block = (page: Page) => page.getByRole('region', { name: 'Contact details' })
const clock = (page: Page) => page.getByRole('main').getByRole('complementary', { name: 'Shared working hours' })

test('the contact page has its title, heading and pricing line', async ({ page }) => {
  const response = await page.goto('/contact')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Contact | Hai Son Nguyen')
  const main = page.getByRole('main')
  await expect(main.getByText('Contact', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tell me what you are building')
  await expect(main.getByText(profile.pricing, { exact: true })).toBeVisible()
  await expect(page.getByText('This page is not built yet.')).toHaveCount(0)
})

test('a normal visit shows the booking button, the email, the hours and the clock', async ({ page }) => {
  await page.goto('/contact')
  await expect(block(page).getByRole('link', { name: profile.booking.label })).toHaveAttribute('href', profile.booking.url)
  await expect(block(page).getByText(profile.email, { exact: true })).toBeVisible()
  await expect(block(page).getByText(profile.replyPromise)).toBeVisible()
  await expect(block(page).getByText(`I work ${profile.hours.label}.`)).toBeVisible()
  await expect(clock(page)).toHaveAttribute('data-state', 'ready')
  await expect(clock(page)).toContainText('Hanoi now')
})

test('Upwork mode shows only "Message me on Upwork", and the clock', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/contact-details.json')) requests.push(request.url())
  })
  await page.goto('/contact?from=upwork')
  await expect(block(page).getByRole('link', { name: 'Message me on Upwork' })).toHaveAttribute('href', profile.links.upwork)
  await expect(block(page).getByRole('link', { name: profile.booking.label })).toHaveCount(0)
  await expect(block(page).getByRole('button', { name: 'Copy email' })).toHaveCount(0)
  await expect(clock(page)).toHaveAttribute('data-state', 'ready')
  await page.waitForLoadState('networkidle')
  const html = (await page.content()).toLowerCase()
  expect(html).not.toContain(profile.email.toLowerCase())
  expect(html).not.toContain(profile.email.split('@')[0]!.toLowerCase())
  expect(html).not.toContain('cal.com')
  expect(html).not.toContain('mailto:')
  expect(requests).toEqual([])
  await expect(page.locator('a[href^="/contact"]:visible')).toHaveCount(0)
})

test('with JavaScript off, the page shows the heading, the Upwork version and the clock', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/contact')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tell me what you are building')
  await expect(block(page).getByRole('link', { name: 'Message me on Upwork' })).toBeVisible()
  await expect(clock(page)).toContainText('Hanoi')
  await context.close()
})

test.describe('on a desktop', () => {
  test.use({ viewport: desktop })

  test('the clock sits to the right of the contact block', async ({ page }) => {
    await page.goto('/contact')
    await expect(block(page).getByText(profile.email, { exact: true })).toBeVisible()
    const one = await block(page).boundingBox()
    const two = await clock(page).boundingBox()
    expect(Math.abs(two!.y - one!.y)).toBeLessThan(1)
    expect(two!.x).toBeGreaterThan(one!.x + one!.width)
  })
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('the clock sits below the block, and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/contact')
      await expect(block(page).getByText(profile.email, { exact: true })).toBeVisible()
      await expect(clock(page)).toHaveAttribute('data-state', 'ready')
      const one = await block(page).boundingBox()
      const two = await clock(page).boundingBox()
      expect(two!.y).toBeGreaterThanOrEqual(one!.y + one!.height)
      expect(two!.x + two!.width).toBeLessThanOrEqual(phone.width)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
    })
  })
}
