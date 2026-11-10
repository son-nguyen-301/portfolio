// The header, the footer and the phone menu on every generated page (PF-006).
// Run `pnpm generate` first.
import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const built = fileURLToPath(new URL('../../.output/public', import.meta.url))

// Every HTML page in the build, as a URL path. 200.html is the empty app shell
// that Nuxt writes for client-only routes; no link points to it.
function pages(dir = built, prefix = ''): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((item) => {
    const rel = `${prefix}/${item.name}`
    if (item.isDirectory()) return item.name.startsWith('_') ? [] : pages(dir, rel)
    if (!item.name.endsWith('.html') || rel === '/200.html') return []
    return [rel.replace(/index\.html$/, '')]
  })
}

const paths = pages()

const phone = { width: 360, height: 740 }

async function sidewaysScroll(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
}

test('the build has every page in the header and footer, and the 404 page', () => {
  expect(paths.sort()).toEqual(['/', '/404.html', '/about/', '/contact/', '/cv/', '/lab/', '/services/', '/work/'])
})

for (const path of paths) {
  test(`${path} has the header, the footer and one main heading`, async ({ page }) => {
    await page.goto(path)
    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('banner').getByRole('link', { name: 'Hai Son Nguyen' })).toHaveAttribute('href', '/')
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    await expect(page.getByRole('contentinfo')).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Footer' })).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
  })

  test(`${path} has no sideways scroll at 360px in both themes`, async ({ browser }) => {
    for (const theme of ['light', 'dark']) {
      const context = await browser.newContext({ viewport: phone })
      const page = await context.newPage()
      await page.addInitScript(value => localStorage.setItem('theme', value), theme)
      await page.goto(path)
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      expect(await sidewaysScroll(page)).toBe(0)
      await page.getByRole('button', { name: 'Open menu' }).click()
      await expect(page.getByRole('dialog', { name: 'Menu' })).toBeVisible()
      expect(await sidewaysScroll(page)).toBe(0)
      await context.close()
    }
  })
}

test('every page link in the header is built', async ({ page }) => {
  await page.goto('/')
  const links = page.getByRole('navigation', { name: 'Main' }).getByRole('link')
  for (const href of await links.evaluateAll(items => items.map(item => item.getAttribute('href')))) {
    const response = await page.request.get(`${href}/`)
    expect(response.status(), href!).toBe(200)
  }
})

test('the link to the page you are on is marked', async ({ page }) => {
  await page.goto('/services/')
  const nav = page.getByRole('navigation', { name: 'Main' })
  await expect(nav.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'page')
  await expect(nav.getByRole('link', { name: 'Work' })).not.toHaveAttribute('aria-current', 'page')
})

test('the skip link is the first stop and moves focus to the main content', async ({ page }) => {
  await page.goto('/about/')
  await page.keyboard.press('Tab')
  const skip = page.getByRole('link', { name: 'Skip to content' })
  await expect(skip).toBeFocused()
  await expect(skip).toBeInViewport()
  await page.keyboard.press('Enter')
  await expect(page.getByRole('main')).toBeFocused()
})

test.describe('on a phone', () => {
  test.use({ viewport: phone })

  test('the links hide behind a menu button and the header stays on screen', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden()
    await expect(page.getByRole('banner').getByRole('link', { name: 'Book a 30-minute call' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible()
    await page.mouse.wheel(0, 2000)
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeInViewport()
  })

  test('the keyboard can reach and open the menu, and Escape closes it', async ({ page }) => {
    await page.goto('/')
    const button = page.getByRole('button', { name: 'Open menu' })
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    // Skip link, name, menu button.
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    await expect(button).toBeFocused()
    await page.keyboard.press('Enter')

    const menu = page.getByRole('dialog', { name: 'Menu' })
    await expect(menu).toBeVisible()
    await expect(button).toHaveAttribute('aria-expanded', 'true')
    await expect(menu.getByRole('link')).toHaveText(['Work', 'Services', 'Lab', 'About', 'CV', 'Contact', 'Book a 30-minute call'])
    // Focus moves into the menu, and Tab stays inside it.
    await expect(menu.getByRole('button', { name: 'Close menu' })).toBeFocused()
    for (let i = 0; i < 12; i++) await page.keyboard.press('Tab')
    expect(await menu.evaluate(dialog => dialog.contains(document.activeElement))).toBe(true)

    await page.keyboard.press('Escape')
    await expect(menu).toBeHidden()
    await expect(button).toHaveAttribute('aria-expanded', 'false')
    await expect(button).toBeFocused()
  })

  test('the menu closes when the window gets wider', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await expect(menu).toBeVisible()
    await expect(menu.getByRole('navigation', { name: 'Pages' })).toBeVisible()
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(menu).toBeHidden()
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible()
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden')
  })

  test('browser Back closes the menu', async ({ page }) => {
    await page.goto('/')
    const button = page.getByRole('button', { name: 'Open menu' })
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await button.click()
    await menu.getByRole('link', { name: 'Lab' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lab')
    await button.click()
    await expect(menu).toBeVisible()
    await page.goBack()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hai Son Nguyen')
    await expect(menu).toBeHidden()
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).overflow)).not.toBe('hidden')
  })

  test('a link in the menu opens the page and closes the menu', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: 'Open menu' }).click()
    const menu = page.getByRole('dialog', { name: 'Menu' })
    await menu.getByRole('link', { name: 'Lab' }).click()
    await expect(page).toHaveURL(/\/lab\/?$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lab')
    await expect(menu).toBeHidden()
  })
})

test('the 404 page says the page does not exist and links home and to the work', async ({ page }) => {
  await page.goto('/404.html')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page doesn\'t exist')
  await expect(page).toHaveTitle(/Page not found/)
  await expect(page.getByRole('main').getByRole('link', { name: 'See my work' })).toHaveAttribute('href', '/work')
  await page.getByRole('main').getByRole('link', { name: 'Go to the home page' }).click()
  await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hai Son Nguyen')
})

test('the header still works from the 404 page', async ({ page }) => {
  await page.goto('/404.html')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page doesn\'t exist')
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Work' }).click()
  await expect(page).toHaveURL(/\/work\/?$/)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Work')
})
