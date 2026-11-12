// The Lab page (PF-017, docs/design/Lab.dc.html). Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const content = fileURLToPath(new URL('../../content', import.meta.url))
const profile = parse(readFileSync(join(content, 'profile.yml'), 'utf8')) as { email: string, booking: { url: string } }

type Project = { name: string, summary: string, status: string, stack: string[], link: string | null, order: number, media: { type: string, src?: string, alt: string } }
const projects: Project[] = readdirSync(join(content, 'lab'))
  .filter(file => file.endsWith('.yml'))
  .map(file => parse(readFileSync(join(content, 'lab', file), 'utf8')) as Project)
  .sort((a, b) => a.order - b.order)

const phone = { width: 360, height: 740 }
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

test('the task runner shows its diagram; the others show a placeholder, never the TODO note', async ({ page }) => {
  await page.goto('/lab')
  for (const [i, project] of projects.entries()) {
    const media = cards(page).nth(i).locator('[data-media]')
    if (project.media.type === 'diagram') {
      await expect(media).toHaveAttribute('data-media', 'diagram')
      const svg = media.getByRole('img', { name: project.media.alt, exact: true })
      await expect(svg).toBeVisible()
      await expect(svg).toHaveClass(/diagram/)
      await expect(svg.locator('title')).toHaveText(project.media.alt)
    }
    else {
      await expect(media, project.name).toHaveAttribute('data-media', 'placeholder')
      await expect(media).toHaveText('Screenshot coming')
    }
  }
  await expect(page.locator('main')).not.toContainText('TODO')
  expect(projects.filter(project => project.media.type === 'diagram').map(project => project.name)).toEqual(['GitHub task runner'])
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

    test('one column, the diagram fits, and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/lab')
      const one = await cards(page).nth(0).boundingBox()
      const two = await cards(page).nth(1).boundingBox()
      expect(two!.y).toBeGreaterThan(one!.y + one!.height)
      const svg = page.locator('main svg.diagram')
      await svg.scrollIntoViewIfNeeded()
      const box = await svg.boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(phone.width)
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
})
