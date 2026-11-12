// ContactBlock on a normal visit and in Upwork mode (PF-008, docs/brief.md).
// The block is on the home page and on /contact; these tests use /contact.
// Run `pnpm generate` first.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const profile = parse(readFileSync(fileURLToPath(new URL('../../content/profile.yml', import.meta.url)), 'utf8')) as {
  email: string
  booking: { url: string, label: string }
  links: { upwork: string }
  replyPromise: string
}

const block = (page: Page) => page.getByRole('region', { name: 'Contact details' })

// Every request to the contact file or to Nuxt Content's profile copy.
function watchContactRequests(page: Page) {
  const urls: string[] = []
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/contact-details.json') || url.includes('/__nuxt_content/profile')) urls.push(url)
  })
  return urls
}

async function expectNoContactDetails(page: Page) {
  const html = (await page.content()).toLowerCase()
  expect(html).not.toContain(profile.email.toLowerCase())
  expect(html).not.toContain(profile.email.split('@')[0]!.toLowerCase())
  expect(html).not.toContain('cal.com')
  expect(html).not.toContain('mailto:')
  // The header and footer keep their Contact links in the HTML, hidden by CSS
  // (D-020), so no link to /contact may be visible.
  const contactLinks = page.locator('a[href^="/contact"]')
  for (const link of await contactLinks.all()) await expect(link).toBeHidden()
}

test('a normal visit shows the booking button, the email and the hours', async ({ page }) => {
  await page.goto('/contact/')
  await expect(block(page).getByRole('link', { name: profile.booking.label })).toHaveAttribute('href', profile.booking.url)
  await expect(block(page).getByText(profile.email, { exact: true })).toBeVisible()
  await expect(block(page).getByRole('button', { name: 'Copy email' })).toBeVisible()
  await expect(block(page).getByText(profile.replyPromise)).toBeVisible()
  await expect(block(page).getByRole('link', { name: 'Message me on Upwork' })).toHaveCount(0)
})

test('Copy email copies the email and shows "Copied" for 2 seconds', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.clock.install()
  await page.goto('/contact/')
  const button = block(page).getByRole('button', { name: 'Copy email' })
  await button.click()
  await expect(block(page).getByRole('button', { name: 'Copied' })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(profile.email)
  await page.clock.runFor(2100)
  await expect(button).toBeVisible()
})

test('Copy email selects the email when the clipboard is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: () => Promise.reject(new DOMException('Blocked', 'NotAllowedError')) } })
  })
  await page.goto('/contact/')
  await block(page).getByRole('button', { name: 'Copy email' }).click()
  await expect.poll(() => page.evaluate(() => window.getSelection()?.toString())).toBe(profile.email)
})

test('a visit from Upwork never shows or downloads the contact details', async ({ page }) => {
  const requests = watchContactRequests(page)
  await page.goto('/?from=upwork')
  await page.waitForLoadState('networkidle')
  await expectNoContactDetails(page)

  // A direct link to /contact, three pages by full load, and one by a link.
  for (const path of ['/contact/', '/about/', '/services/', '/cv/']) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await expectNoContactDetails(page)
  }
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Work' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Case studies')
  await page.waitForLoadState('networkidle')
  await expectNoContactDetails(page)

  await page.goto('/contact/')
  await expect(block(page).getByRole('link', { name: 'Message me on Upwork' })).toHaveAttribute('href', profile.links.upwork)
  await expect(block(page).getByText(profile.replyPromise)).toBeVisible()
  await page.waitForLoadState('networkidle')
  await expectNoContactDetails(page)
  expect(requests).toEqual([])
})

test('with JavaScript off, the contact page shows the Upwork version', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/contact/')
  await expect(block(page).getByRole('link', { name: 'Message me on Upwork' })).toHaveAttribute('href', profile.links.upwork)
  const html = await page.content()
  expect(html).not.toContain(profile.email)
  expect(html).not.toContain('cal.com')
  await context.close()
})

test.describe('on a phone', () => {
  test.use({ viewport: { width: 360, height: 740 } })

  test('the block fits with no sideways scroll', async ({ page }) => {
    await page.goto('/contact/')
    await expect(block(page).getByText(profile.email, { exact: true })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(360)
  })
})
