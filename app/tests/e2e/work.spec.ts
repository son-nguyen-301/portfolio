// The work list (PF-012, docs/design/Work.dc.html). Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const content = fileURLToPath(new URL('../../content', import.meta.url))
const profile = parse(readFileSync(join(content, 'profile.yml'), 'utf8')) as {
  email: string
  workList: { intro: string, more: string }
}

// Case study front matter and body, in `order`.
type Study = { slug: string, title: string, summary: string, client: string, period: string, cardMetric?: string, stack: string[], order: number, body: string }
const studies: Study[] = readdirSync(join(content, 'work'))
  .filter(file => file.endsWith('.md'))
  .map((file) => {
    const [, front = '', ...rest] = readFileSync(join(content, 'work', file), 'utf8').split(/^---$/m)
    return { slug: file.replace(/\.md$/, ''), body: rest.join('---'), ...parse(front) } as Study
  })
  .sort((a, b) => a.order - b.order)

const phone = { width: 360, height: 740 }
// Only the list's own items, not the stack tags inside each card.
const cards = (page: Page) => page.getByRole('list', { name: 'Case studies' }).locator(':scope > li')

test('the work page has its title, intro and heading', async ({ page }) => {
  const response = await page.goto('/work')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Work | Hai Son Nguyen')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Case studies')
  await expect(page.getByText(profile.workList.intro)).toBeVisible()
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', profile.workList.intro)
})

test('every case study is listed in `order`, with the fields from its front matter', async ({ page }) => {
  expect(studies).toHaveLength(6)
  await page.goto('/work')
  await expect(cards(page)).toHaveCount(studies.length)
  await expect(cards(page).getByRole('heading', { level: 2 })).toHaveText(studies.map(study => study.title))
  for (const [i, study] of studies.entries()) {
    const card = cards(page).nth(i)
    await expect(card.getByRole('link')).toHaveAttribute('href', `/work/${study.slug}`)
    await expect(card.locator('.work-card__summary')).toHaveText(study.summary)
    await expect(card.locator('.work-card__client')).toHaveText(study.client)
    await expect(card.locator('.work-card__period')).toHaveText(study.period)
    if (study.cardMetric) await expect(card.locator('.work-card__metric')).toHaveText(study.cardMetric)
    await expect(card.getByRole('list', { name: 'Stack' }).getByRole('listitem')).toHaveText(study.stack)
  }
})

test('each card opens its own case study page', async ({ page }) => {
  for (const study of studies) {
    const response = await page.request.get(`/work/${study.slug}`)
    expect(response.status(), study.slug).toBe(200)
  }
  await page.goto('/work')
  const last = studies.at(-1)!
  await cards(page).getByRole('link', { name: last.title }).click()
  await expect(page).toHaveURL(new RegExp(`/work/${last.slug}/?$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(last.title)
})

test('the Lab and earlier projects links go to real pages', async ({ page }) => {
  await page.goto('/work')
  const more = page.getByRole('region', { name: 'Smaller and older projects' })
  await expect(more.getByText(profile.workList.more)).toBeVisible()
  await expect(more.getByRole('link', { name: 'Lab' })).toHaveAttribute('href', '/lab')
  await expect(more.getByRole('link', { name: 'Earlier projects' })).toHaveAttribute('href', '/about#earlier')
  for (const href of ['/lab', '/about']) {
    expect((await page.request.get(href)).status(), href).toBe(200)
  }
})

test('the page data holds the cards, not the case study bodies or the email', async ({ request }) => {
  const html = await (await request.get('/work')).text()
  const data = await (await request.get('/work/_payload.json')).text()
  for (const study of studies) {
    // A sentence from the body: the first long line after "## The problem".
    const line = study.body.split('\n').map(text => text.trim()).find(text => text.length > 40 && !text.startsWith('#'))
    expect(line, study.slug).toBeDefined()
    expect(html, study.slug).not.toContain(line)
    expect(data, study.slug).not.toContain(line)
  }
  expect(html).not.toContain(profile.email)
  expect(data).not.toContain(profile.email)
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('the cards stack in one column, and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/work')
      const first = await cards(page).nth(0).boundingBox()
      const second = await cards(page).nth(1).boundingBox()
      expect(second!.y).toBeGreaterThan(first!.y + first!.height)
      await page.getByRole('region', { name: 'Smaller and older projects' }).scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
    })
  })
}

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('the cards sit two to a row', async ({ page }) => {
    await page.goto('/work')
    const first = await cards(page).nth(0).boundingBox()
    const second = await cards(page).nth(1).boundingBox()
    expect(Math.abs(second!.y - first!.y)).toBeLessThan(1)
    expect(second!.x).toBeGreaterThan(first!.x + first!.width)
  })

  test('the card titles are the size of the design, larger than on the home page', async ({ page }) => {
    await page.goto('/work')
    await expect(cards(page).first().getByRole('heading', { level: 2 })).toHaveCSS('font-size', '23px')
  })
})
