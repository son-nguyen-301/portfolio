// The 404 page (PF-019, docs/design/NotFound.dc.html). `404.html` is rendered
// at build time from app/error.vue (D-035), so it shows without JavaScript.
// Workers sends it for any path that is not there (wrangler.jsonc). sirv does
// not, so the tests that open a missing path send the file themselves.
// Run `pnpm generate` first.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const notFoundHtml = readFileSync(fileURLToPath(new URL('../../.output/public/404.html', import.meta.url)), 'utf8')

const phone = { width: 360, height: 740 }

// Answer a missing path the way Workers does: status 404 with 404.html.
async function serveNotFound(page: Page, path: string) {
  await page.route(`**${path}`, route => route.fulfill({ status: 404, contentType: 'text/html', body: notFoundHtml }))
}

// Console errors and uncaught errors on the page. Chrome logs the 404 status
// of the missing page itself as an error; that one is expected.
function watchErrors(page: Page, missing?: string) {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() !== 'error') return
    if (missing && message.text().includes('status of 404') && new URL(message.location().url).pathname === missing) return
    errors.push(`${message.text()} (${message.location().url})`)
  })
  page.on('pageerror', error => errors.push(error.message))
  return errors
}

async function expectNotFoundPage(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page doesn\'t exist')
  const main = page.getByRole('main')
  await expect(main.getByText('404', { exact: true })).toBeVisible()
  await expect(main.getByText('The link may be old, or there may be a typo in it.')).toBeVisible()
  await expect(main.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/')
  await expect(main.getByRole('link', { name: 'See my work' })).toHaveAttribute('href', '/work')
}

test('404.html holds the page, not an empty app shell', () => {
  expect(notFoundHtml).toContain('This page doesn&#39;t exist')
  expect(notFoundHtml).toContain('Go to the home page')
  expect(notFoundHtml).toMatch(/<meta name="robots" content="noindex/)
  expect(notFoundHtml).toContain('<title>Page not found')
})

test('with JavaScript off, the 404 page shows its message and both links', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/404.html')
  await expectNotFoundPage(page)
  await context.close()
})

test('opening 404.html logs no error', async ({ page }) => {
  const errors = watchErrors(page)
  await page.goto('/404.html')
  await expectNotFoundPage(page)
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

test('a missing path shows the 404 page, logs no error, and its links work', async ({ page }) => {
  await serveNotFound(page, '/no-such-page')
  const errors = watchErrors(page, '/no-such-page')
  const response = await page.goto('/no-such-page')
  expect(response?.status()).toBe(404)
  await expectNotFoundPage(page)
  await expect(page).toHaveTitle(/Page not found/)
  await expect(page).toHaveURL(/\/no-such-page$/)
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
  await page.getByRole('main').getByRole('link', { name: 'See my work' }).click()
  await expect(page).toHaveURL(/\/work\/?$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Case studies')
})

test('a missing case study shows the 404 page', async ({ page }) => {
  await serveNotFound(page, '/work/no-such-study')
  const errors = watchErrors(page, '/work/no-such-study')
  await page.goto('/work/no-such-study')
  await expectNotFoundPage(page)
  await page.waitForLoadState('networkidle')
  expect(errors).toEqual([])
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('the 404 page fits with no sideways scroll', async ({ page }) => {
      await page.goto('/404.html')
      await expectNotFoundPage(page)
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
    })
  })
}
