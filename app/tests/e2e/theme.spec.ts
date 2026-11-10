// The theme switch, the head script that applies a saved choice before paint,
// and the dev-only gallery staying out of the build.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const built = fileURLToPath(new URL('../../.output/public', import.meta.url))

// --paper in each theme (app/assets/css/tokens.css).
const lightPaper = 'rgb(245, 247, 248)'
const darkPaper = 'rgb(14, 18, 22)'

const html = (page: Page) => page.locator('html')
const switchButton = (page: Page, name: string) =>
  page.getByRole('group', { name: 'Theme' }).getByRole('button', { name })
const bodyBackground = (page: Page) => page.evaluate(() => getComputedStyle(document.body).backgroundColor)

test('the switch sets data-theme, and the choice lasts after a reload', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('pageerror', error => errors.push(error.message))

  await page.goto('/')
  await expect(html(page)).not.toHaveAttribute('data-theme')
  await expect(switchButton(page, 'System')).toHaveAttribute('aria-pressed', 'true')
  expect(await bodyBackground(page)).toBe(lightPaper)

  await switchButton(page, 'Dark').click()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')
  await expect(switchButton(page, 'Dark')).toHaveAttribute('aria-pressed', 'true')
  await expect(switchButton(page, 'System')).toHaveAttribute('aria-pressed', 'false')
  expect(await bodyBackground(page)).toBe(darkPaper)

  await page.reload()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')
  await expect(switchButton(page, 'Dark')).toHaveAttribute('aria-pressed', 'true')
  expect(await bodyBackground(page)).toBe(darkPaper)

  await switchButton(page, 'Light').click()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
  await page.reload()
  await expect(html(page)).toHaveAttribute('data-theme', 'light')
  expect(await bodyBackground(page)).toBe(lightPaper)

  await switchButton(page, 'System').click()
  await expect(html(page)).not.toHaveAttribute('data-theme')
  await page.reload()
  await expect(html(page)).not.toHaveAttribute('data-theme')
  await expect(switchButton(page, 'System')).toHaveAttribute('aria-pressed', 'true')

  // No hydration mismatch or script error along the way.
  expect(errors).toEqual([])
})

test.describe('with the system set to dark', () => {
  test.use({ colorScheme: 'dark' })

  test('the page follows the system, and a light choice wins', async ({ page }) => {
    await page.goto('/')
    expect(await bodyBackground(page)).toBe(darkPaper)
    await switchButton(page, 'Light').click()
    expect(await bodyBackground(page)).toBe(lightPaper)
  })
})

test('a saved choice is on <html> before the page paints', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('theme', 'dark'))
  // Record data-theme from the first point the body exists, before any app code.
  await page.addInitScript(() => {
    document.addEventListener('readystatechange', () => {
      if (document.readyState === 'interactive') {
        (window as unknown as { firstTheme: string | null }).firstTheme = document.documentElement.getAttribute('data-theme')
      }
    }, { once: true })
  })
  await page.goto('/')
  expect(await page.evaluate(() => (window as unknown as { firstTheme: string | null }).firstTheme)).toBe('dark')
})

test('the theme still works when local storage is blocked', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', {
      get() {
        throw new DOMException('blocked', 'SecurityError')
      },
    })
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/')
  await switchButton(page, 'Dark').click()
  await expect(html(page)).toHaveAttribute('data-theme', 'dark')
  expect(errors).toEqual([])
})

test('the home page has no sideways scroll at 360px in both themes', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 740 })
  for (const theme of ['light', 'dark']) {
    await page.addInitScript(value => localStorage.setItem('theme', value), theme)
    await page.goto('/')
    await expect(html(page)).toHaveAttribute('data-theme', theme)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
    expect(overflow).toBe(0)
  }
})

test('the dev-only gallery is not built and not in the sitemap', async ({ page }) => {
  expect(existsSync(join(built, '_gallery'))).toBe(false)
  expect(existsSync(join(built, '_gallery.html'))).toBe(false)
  expect(readFileSync(join(built, 'sitemap.xml'), 'utf8')).not.toContain('_gallery')
  const response = await page.goto('/_gallery')
  expect(response?.status()).toBe(404)
})
