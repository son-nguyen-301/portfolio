// The case study pages (PF-013, docs/design/CaseStudy.dc.html and
// CaseStudyPhone.dc.html). Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const content = fileURLToPath(new URL('../../content', import.meta.url))
const profile = parse(readFileSync(join(content, 'profile.yml'), 'utf8')) as { pricing: string, replyPromise: string, links: { upwork: string } }

type Study = {
  slug: string
  title: string
  summary: string
  client: string
  role: string
  team?: string
  period: string
  stack: string[]
  order: number
  metrics: { value: string, label: string }[]
  quote: { text: string, role: string } | null
  media: { type: string, src?: string, alt: string, caption?: string }[]
  body: string
}
const studies: Study[] = readdirSync(join(content, 'work'))
  .filter(file => file.endsWith('.md'))
  .map((file) => {
    const [, front = '', ...rest] = readFileSync(join(content, 'work', file), 'utf8').split(/^---$/m)
    return { slug: file.replace(/\.md$/, ''), body: rest.join('---'), ...parse(front) } as Study
  })
  .sort((a, b) => a.order - b.order)

const phone = { width: 360, height: 740 }
const facts = (page: Page) => page.getByRole('complementary', { name: 'Project facts' })
const story = (page: Page) => page.locator('article')
const more = (page: Page) => page.getByRole('navigation', { name: 'More case studies' })

test('there are 6 case studies', () => {
  expect(studies).toHaveLength(6)
})

for (const [i, study] of studies.entries()) {
  test.describe(study.slug, () => {
    test('has its title, summary and facts', async ({ page }) => {
      const response = await page.goto(`/work/${study.slug}`)
      expect(response?.status()).toBe(200)
      await expect(page).toHaveTitle(`${study.title} | Hai Son Nguyen`)
      await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', study.summary)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(study.title)
      await expect(page.getByText(study.summary, { exact: true })).toBeVisible()
      await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toHaveText(`Work / Case study ${i + 1} of ${studies.length}`)

      const list = facts(page).locator('dl')
      await expect(list.locator('dt')).toHaveText(['Client', 'Role', ...(study.team ? ['Team'] : []), 'When', 'Stack'])
      await expect(list.locator('dd').nth(0)).toHaveText(study.client)
      await expect(list.locator('dd').nth(1)).toHaveText(study.role)
      if (study.team) await expect(list.locator('dd').nth(2)).toHaveText(study.team)
      await expect(list.getByText(study.period, { exact: true })).toBeVisible()
      await expect(list.getByRole('list', { name: 'Stack' }).getByRole('listitem')).toHaveText(study.stack)
    })

    test('has its sections in the order of the design', async ({ page }) => {
      await page.goto(`/work/${study.slug}`)
      const expected = [
        'the-problem', 'what-i-did', 'the-result',
        ...(study.media.length ? ['media'] : []),
        ...(study.quote ? ['quote'] : []),
        'contact',
      ]
      const sections = await story(page).locator(':scope > [data-section]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-section')))
      expect(sections).toEqual(expected)
      await expect(story(page).locator(':scope > section h2')).toHaveText([
        'The problem', 'What I did', 'The result',
        ...(study.media.length ? [/^(Screens|Diagrams?|Screens and diagrams)$/] : []),
        'Need something like this?',
      ])
      // The steps of "What I did" are a numbered list.
      await expect(page.locator('[data-section="what-i-did"] ol > li').first()).toBeVisible()
      await expect(page.getByRole('region', { name: 'Need something like this?' }).getByText(profile.pricing)).toBeVisible()
    })

    test('shows the result tiles, or none when there are no numbers', async ({ page }) => {
      await page.goto(`/work/${study.slug}`)
      const tiles = page.getByRole('list', { name: 'Results' })
      if (!study.metrics.length) {
        await expect(tiles).toHaveCount(0)
        return
      }
      await expect(tiles.getByRole('listitem')).toHaveCount(study.metrics.length)
      for (const [n, metric] of study.metrics.entries()) {
        await expect(tiles.getByRole('listitem').nth(n).locator('.metric-tile__value')).toHaveText(metric.value)
        await expect(tiles.getByRole('listitem').nth(n).locator('.metric-tile__label')).toHaveText(metric.label)
      }
    })

    test('calls out the hard choice, when the story has one', async ({ page }) => {
      await page.goto(`/work/${study.slug}`)
      const callout = page.locator('.hard-choice')
      if (!study.body.includes('**Hard choice:**')) {
        await expect(callout).toHaveCount(0)
        return
      }
      await expect(callout).toHaveCount(1)
      await expect(callout.locator('.label')).toHaveText('Hard choice')
      await expect(page.locator('[data-section="what-i-did"] .hard-choice')).toBeVisible()
      await expect(page.locator('[data-section="what-i-did"] blockquote')).toHaveCount(0)
    })

    test('shows its media with no broken image and no TODO note', async ({ page }) => {
      await page.goto(`/work/${study.slug}`)
      const figures = page.locator('[data-section="media"] figure')
      await expect(figures).toHaveCount(study.media.length)
      for (const item of study.media) {
        if (item.caption?.startsWith('TODO')) await expect(page.getByText(item.caption)).toHaveCount(0)
      }
      for (const img of await page.locator('main img').all()) {
        await img.scrollIntoViewIfNeeded()
        await expect.poll(() => img.evaluate((node: HTMLImageElement) => node.complete && node.naturalWidth > 0)).toBe(true)
      }
    })

    test('links the previous and next case studies', async ({ page }) => {
      await page.goto(`/work/${study.slug}`)
      const links = more(page).getByRole('link')
      await expect(links).toHaveCount(2)
      const previous = studies[i - 1]
      const next = studies[i + 1]
      await expect(links.nth(0)).toHaveAttribute('href', previous ? `/work/${previous.slug}` : '/work')
      await expect(links.nth(0)).toContainText(previous ? previous.title : `Back to the ${studies.length} case studies`)
      await expect(links.nth(1)).toHaveAttribute('href', next ? `/work/${next.slug}` : '/work')
      await expect(links.nth(1)).toContainText(next ? next.title : `Back to the ${studies.length} case studies`)
    })
  })
}

test('the next link opens the next case study', async ({ page }) => {
  await page.goto(`/work/${studies[0]!.slug}`)
  await more(page).getByRole('link', { name: /Next/ }).click()
  await expect(page).toHaveURL(new RegExp(`/work/${studies[1]!.slug}/?$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(studies[1]!.title)
})

test('the contact actions go to the contact page outside Upwork mode', async ({ page }) => {
  await page.goto(`/work/${studies[0]!.slug}`)
  const main = page.locator('main')
  await expect(main.getByRole('link', { name: 'Book a 30-minute call' })).toHaveCount(2)
  for (const link of await main.getByRole('link', { name: 'Book a 30-minute call' }).all()) {
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', '/contact')
  }
  await expect(main.getByRole('link', { name: 'Message me on Upwork' })).toHaveCount(0)
  await expect(facts(page).getByText(profile.replyPromise)).toBeVisible()
})

test('Upwork mode hides the contact actions on case study pages', async ({ page }) => {
  for (const study of [studies[0]!, studies.at(-1)!]) {
    await page.goto(`/work/${study.slug}?from=upwork`)
    const main = page.locator('main')
    await expect(main.getByRole('link', { name: 'Book a 30-minute call' })).toHaveCount(0)
    await expect(main.locator('a[href="/contact"]:visible')).toHaveCount(0)
    const upwork = main.getByRole('link', { name: 'Message me on Upwork' })
    await expect(upwork).toHaveCount(2)
    for (const link of await upwork.all()) {
      await expect(link).toBeVisible()
      await expect(link).toHaveAttribute('href', profile.links.upwork)
    }
  }
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('one column: the title, the facts, then the story, and nothing scrolls sideways', async ({ page }) => {
      for (const study of studies) {
        await page.goto(`/work/${study.slug}`)
        const title = await page.getByRole('heading', { level: 1 }).boundingBox()
        const panel = await facts(page).boundingBox()
        const problem = await page.locator('[data-section="the-problem"]').boundingBox()
        expect(panel!.y, study.slug).toBeGreaterThan(title!.y + title!.height)
        expect(problem!.y, study.slug).toBeGreaterThan(panel!.y + panel!.height)
        expect(await page.evaluate(() => document.documentElement.scrollWidth), study.slug).toBeLessThanOrEqual(phone.width)
      }
    })
  })
}

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('the side panel sits left of the title and the story', async ({ page }) => {
    await page.goto(`/work/${studies[0]!.slug}`)
    const panel = await facts(page).boundingBox()
    const title = await page.getByRole('heading', { level: 1 }).boundingBox()
    const problem = await page.locator('[data-section="the-problem"]').boundingBox()
    expect(title!.x).toBeGreaterThan(panel!.x + panel!.width)
    expect(problem!.x).toBeGreaterThan(panel!.x + panel!.width)
    expect(Math.abs(title!.y - panel!.y)).toBeLessThan(40)
  })
})
