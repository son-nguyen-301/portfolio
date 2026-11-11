// Upwork mode in the header, the phone menu and the footer (PF-007,
// docs/brief.md). Run `pnpm generate` first.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const profile = parse(readFileSync(fileURLToPath(new URL('../../content/profile.yml', import.meta.url)), 'utf8')) as { links: { upwork: string, linkedin: string } }

const phone = { width: 360, height: 740 }

async function expectUpworkHeader(page: Page) {
  const banner = page.getByRole('banner')
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav.getByRole('link')).toHaveText(['Work', 'Services', 'Lab', 'About'])
  await expect(banner.getByRole('link', { name: 'Book a 30-minute call' })).toBeHidden()
  await expect(banner.getByRole('link', { name: 'Message me on Upwork' })).toHaveAttribute('href', profile.links.upwork)
  await expect(banner.getByRole('link', { name: 'Message me on Upwork' })).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('data-upwork', '')
}

async function expectUpworkFooter(page: Page) {
  const footer = page.getByRole('contentinfo')
  await expect(page.getByRole('navigation', { name: 'Footer' }).getByRole('link')).toHaveText(['Work', 'Services', 'Lab', 'About', 'CV'])
  await expect(footer.getByRole('link', { name: 'LinkedIn' })).toBeHidden()
  await expect(footer.getByRole('link', { name: 'GitHub' })).toBeVisible()
  await expect(footer.getByRole('link', { name: 'Upwork' })).toBeVisible()
}

test('a normal visit shows Contact, the call button and LinkedIn, and no Upwork button', async ({ page }) => {
  await page.goto('/')
  const banner = page.getByRole('banner')
  await expect(page.getByRole('navigation', { name: 'Main' }).getByRole('link')).toHaveText(['Work', 'Services', 'Lab', 'About', 'Contact'])
  await expect(banner.getByRole('link', { name: 'Book a 30-minute call' })).toBeVisible()
  await expect(banner.getByRole('link', { name: 'Message me on Upwork' })).toBeHidden()
  await expect(page.getByRole('navigation', { name: 'Footer' }).getByRole('link')).toHaveText(['Work', 'Services', 'Lab', 'About', 'CV', 'Contact'])
  await expect(page.getByRole('contentinfo').getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', profile.links.linkedin)
  await expect(page.locator('html')).not.toHaveAttribute('data-upwork')
})

test('/?from=upwork hides Contact, the call button and LinkedIn, and shows "Message me on Upwork"', async ({ page }) => {
  await page.goto('/?from=upwork')
  await expectUpworkHeader(page)
  await expectUpworkFooter(page)
})

test('the page is in Upwork mode before any app code runs', async ({ browser }) => {
  // With the app's JavaScript files blocked, only the inline head script runs.
  const context = await browser.newContext()
  await context.route('**/_nuxt/**/*.js', route => route.abort())
  const page = await context.newPage()
  await page.goto('/?from=upwork')
  await expectUpworkHeader(page)
  await expectUpworkFooter(page)
  await context.close()
})

test('Upwork mode stays on for the other pages of the visit', async ({ page }) => {
  await page.goto('/?from=upwork')
  await expectUpworkHeader(page)

  // A link inside the app.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Work' }).click()
  await expect(page).toHaveURL(/\/work\/?$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Case studies')
  await expectUpworkHeader(page)

  // A full page load in the same tab, with no ?from=upwork.
  for (const path of ['/about/', '/cv/', '/404.html']) {
    await page.goto(path)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expectUpworkHeader(page)
    await expectUpworkFooter(page)
  }
})

test('a new tab without ?from=upwork is a normal visit', async ({ browser }) => {
  const context = await browser.newContext()
  const first = await context.newPage()
  await first.goto('/?from=upwork')
  await expectUpworkHeader(first)
  const second = await context.newPage()
  await second.goto('/')
  await expect(second.getByRole('banner').getByRole('link', { name: 'Book a 30-minute call' })).toBeVisible()
  await expect(second.locator('html')).not.toHaveAttribute('data-upwork')
  await context.close()
})

test('Upwork mode works with storage blocked, while the app stays open', async ({ browser }) => {
  const context = await browser.newContext()
  await context.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new DOMException('Blocked', 'SecurityError')
      },
    })
  })
  const page = await context.newPage()
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/?from=upwork')
  await expectUpworkHeader(page)
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'About' }).click()
  await expect(page).toHaveURL(/\/about\/?$/)
  await expect(page.getByRole('region', { name: 'Career' })).toBeVisible()
  await expectUpworkHeader(page)
  expect(errors).toEqual([])
  await context.close()
})

test.describe('on a phone', () => {
  test.use({ viewport: phone })

  test('the menu has no Contact link and offers "Message me on Upwork"', async ({ page }) => {
    await page.goto('/?from=upwork')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('link')).toHaveText(['Work', 'Services', 'Lab', 'About', 'CV', 'Message me on Upwork'])
    await expect(menu.getByRole('link', { name: 'Message me on Upwork' })).toHaveAttribute('href', profile.links.upwork)
  })

  test('the header shows no Upwork button on a phone', async ({ page }) => {
    await page.goto('/?from=upwork')
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'Message me on Upwork' })).toBeHidden()
  })
})
