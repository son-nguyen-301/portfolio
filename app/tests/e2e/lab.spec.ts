// The Lab page (PF-017, docs/design/Lab.dc.html). Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'
import { textOutOfBox, textOutside, textOverlaps } from './diagram-text'

const content = fileURLToPath(new URL('../../content', import.meta.url))
const profile = parse(readFileSync(join(content, 'profile.yml'), 'utf8')) as { email: string, booking: { url: string } }

type Project = { name: string, summary: string, status: string, stack: string[], link: string | null, order: number, media: { type: string, src?: string, alt: string } }
const projects: Project[] = readdirSync(join(content, 'lab'))
  .filter(file => file.endsWith('.yml'))
  .map(file => parse(readFileSync(join(content, 'lab', file), 'utf8')) as Project)
  .sort((a, b) => a.order - b.order)

const phone = { width: 360, height: 740 }
const selector = 'main svg.diagram'
// Only the list's own items, not the stack tags inside each card.
const cards = (page: Page) => page.getByRole('list', { name: 'Side projects' }).locator(':scope > li')

test('the Lab page has its title and heading', async ({ page }) => {
  const response = await page.goto('/lab')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Lab | Hai Son Nguyen')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Side projects')
  await expect(page.getByText('This page is not built yet.')).toHaveCount(0)
})

test('the 4 projects show in `order`, with the fields from their files', async ({ page }) => {
  expect(projects).toHaveLength(4)
  await page.goto('/lab')
  await expect(cards(page)).toHaveCount(projects.length)
  await expect(cards(page).getByRole('heading', { level: 2 })).toHaveText(projects.map(project => project.name))
  for (const [i, project] of projects.entries()) {
    const card = cards(page).nth(i)
    await expect(card.locator('.lab-card__status')).toHaveText(project.status)
    await expect(card.locator('.lab-card__summary')).toHaveText(project.summary)
    await expect(card.getByRole('list', { name: 'Stack' }).getByRole('listitem')).toHaveText(project.stack)
  }
})

test('only hydra-claude links out', async ({ page }) => {
  const linked = projects.filter(project => project.link)
  expect(linked.map(project => project.name)).toEqual(['hydra-claude'])
  await page.goto('/lab')
  await expect(page.locator('main a')).toHaveCount(1)
  for (const [i, project] of projects.entries()) {
    const links = cards(page).nth(i).getByRole('link')
    if (!project.link) {
      await expect(links, project.name).toHaveCount(0)
      continue
    }
    await expect(links).toHaveCount(1)
    await expect(links).toHaveAttribute('href', project.link)
    await expect(links).toHaveText('See it on GitHub →')
  }
})

test('every project shows its diagram, with its alt text as the title, and no placeholder', async ({ page }) => {
  expect(projects.map(project => project.media.type)).toEqual(projects.map(() => 'diagram'))
  await page.goto('/lab')
  for (const [i, project] of projects.entries()) {
    const media = cards(page).nth(i).locator('[data-media]')
    await expect(media, project.name).toHaveAttribute('data-media', 'diagram')
    const svg = media.getByRole('img', { name: project.media.alt, exact: true })
    await expect(svg).toBeVisible()
    await expect(svg).toHaveClass(/diagram/)
    await expect(svg.locator('title')).toHaveText(project.media.alt)
  }
  await expect(page.locator('main [data-media="placeholder"]')).toHaveCount(0)
  await expect(page.locator('main')).not.toContainText('Screenshot coming')
  await expect(page.locator('main')).not.toContainText('TODO')
  expect(await textOutside(page, selector)).toEqual([])
  expect(await textOutOfBox(page, selector)).toEqual([])
})

test('the Homereel diagram shows only the server and the two apps', async ({ page }) => {
  await page.goto('/lab')
  const homereel = projects.findIndex(project => project.name === 'Homereel')
  const svg = cards(page).nth(homereel).locator('svg.diagram')
  await expect(svg.locator('text')).toHaveText(['Home server', 'movies and shows', 'Homereel', 'Google TV', 'Homereel', 'Android phone'])
  const words = (await svg.textContent())!.toLowerCase()
  for (const part of ['download', 'indexer', 'source']) expect(words).not.toContain(part)
})

test('the built page holds no email or booking link, also in Upwork mode', async ({ page, request }) => {
  for (const path of ['/lab', '/lab/_payload.json']) {
    const text = (await (await request.get(path)).text()).toLowerCase()
    expect(text, path).not.toContain(profile.email.toLowerCase())
    expect(text, path).not.toContain('cal.com')
  }
  await page.goto('/lab?from=upwork')
  await page.waitForLoadState('networkidle')
  const html = (await page.content()).toLowerCase()
  expect(html).not.toContain(profile.email.toLowerCase())
  expect(html).not.toContain(profile.booking.url.toLowerCase())
  expect(html).not.toContain('mailto:')
  await expect(page.locator('main a[href^="/contact"]:visible')).toHaveCount(0)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('one column, every diagram fits with its words inside and apart, and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/lab')
      const one = await cards(page).nth(0).boundingBox()
      const two = await cards(page).nth(1).boundingBox()
      expect(two!.y).toBeGreaterThan(one!.y + one!.height)
      const svgs = page.locator(selector)
      await expect(svgs).toHaveCount(projects.length)
      for (const svg of await svgs.all()) {
        await svg.scrollIntoViewIfNeeded()
        const box = await svg.boundingBox()
        expect(box!.x).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width).toBeLessThanOrEqual(phone.width)
        const [fill, ink] = await svg.evaluate(node => [
          getComputedStyle(node.querySelector('text:not(.diagram__label)')!).fill,
          getComputedStyle(document.body).color,
        ])
        expect(fill).toBe(ink)
      }
      expect(await textOutside(page, selector)).toEqual([])
      expect(await textOverlaps(page, selector)).toEqual([])
      expect(await textOutOfBox(page, selector)).toEqual([])
      await cards(page).last().scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
    })
  })
}

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('the cards sit two to a row', async ({ page }) => {
    await page.goto('/lab')
    const one = await cards(page).nth(0).boundingBox()
    const two = await cards(page).nth(1).boundingBox()
    expect(Math.abs(two!.y - one!.y)).toBeLessThan(1)
    expect(two!.x).toBeGreaterThan(one!.x + one!.width)
  })

  test('the diagrams stay at most 400 px wide', async ({ page }) => {
    await page.goto('/lab')
    for (const svg of await page.locator(selector).all()) {
      const box = await svg.boundingBox()
      expect(box!.width).toBeLessThanOrEqual(400)
    }
  })
})
