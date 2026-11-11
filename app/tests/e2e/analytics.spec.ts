// Click events for "Book a call", "Copy email" and "Message me on Upwork"
// (PF-023, app/utils/analytics.ts). The page gets a stand-in `zaraz.track`, so
// no real analytics service is called. Run `pnpm generate` first.
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function recordEvents(page: Page) {
  await page.addInitScript(() => {
    const sent: string[] = []
    ;(window as unknown as { sent: string[], zaraz: { track: (name: string) => void } }).sent = sent
    ;(window as unknown as { zaraz: { track: (name: string) => void } }).zaraz = { track: name => sent.push(name) }
  })
}

const sent = (page: Page) => page.evaluate(() => (window as unknown as { sent: string[] }).sent)

test('Copy email sends a copy-email event', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await recordEvents(page)
  await page.goto('/contact/')
  await page.getByRole('region', { name: 'Contact details' }).getByRole('button', { name: 'Copy email' }).click()
  await expect.poll(() => sent(page)).toEqual(['copy-email'])
})

test('the booking button and every Upwork button carry their event names', async ({ page }) => {
  await page.goto('/contact/')
  const block = page.getByRole('region', { name: 'Contact details' })
  await expect(block.getByRole('button', { name: 'Copy email' })).toBeVisible()
  await expect(block.locator('[data-track="book-call"]')).toHaveCount(1)
  await page.goto('/contact/?from=upwork')
  await expect(page.locator('[data-track="message-upwork"]')).toHaveCount(3)
})

test('a click on Message me on Upwork sends a message-upwork event', async ({ page }) => {
  await recordEvents(page)
  // Never leave for upwork.com in a test: stop the link once the click has
  // reached the page (the analytics listener runs before, in the capture phase).
  await page.addInitScript(() => {
    window.addEventListener('click', event => event.preventDefault())
  })
  await page.goto('/contact/?from=upwork')
  await page.getByRole('region', { name: 'Contact details' }).getByRole('link', { name: 'Message me on Upwork' }).click()
  await expect.poll(() => sent(page)).toEqual(['message-upwork'])
})
