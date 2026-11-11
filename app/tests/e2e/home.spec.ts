// The home page (PF-011, docs/design.md "Home page, top to bottom").
// Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const content = fileURLToPath(new URL('../../content', import.meta.url))
const read = (file: string) => parse(readFileSync(join(content, file), 'utf8'))

const profile = read('profile.yml') as {
  title: string
  email: string
  booking: { url: string }
  replyPromise: string
  links: { linkedin: string, github: string, upwork: string }
  hero: { label: string, headline: string, subline: string, paths: Array<{ label: string, to: string }> }
  proofStrip: Array<{ value: string, label: string }>
  howIWork: string[]
  aiRules: string[]
  pricing: string
}
const services = read('services.yml') as { items: Array<{ title: string }> }

// Case study front matter, in `order`.
type Study = { slug: string, title: string, order: number, featured: boolean, quote: unknown }
const studies: Study[] = readdirSync(join(content, 'work'))
  .filter(file => file.endsWith('.md'))
  .map((file) => {
    const front = readFileSync(join(content, 'work', file), 'utf8').split(/^---$/m)[1] ?? ''
    return { slug: file.replace(/\.md$/, ''), ...parse(front) } as Study
  })
  .sort((a, b) => a.order - b.order)
const featured = studies.filter(study => study.featured)

const desktop = { width: 1280, height: 800 }
const phone = { width: 360, height: 740 }

const sections = (page: Page) => page.locator('[data-section]').evaluateAll(nodes => nodes.map(node => node.getAttribute('data-section')))
const section = (page: Page, name: string) => page.locator(`[data-section="${name}"]`)

test('the home page has its title, description and main heading', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle(`${profile.title} | Hai Son Nguyen`)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', `${profile.hero.headline} ${profile.hero.subline}`)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(profile.hero.headline)
})

test('the sections come in the order of docs/design.md', async ({ page }) => {
  await page.goto('/')
  // "What people say" shows only once a case study has a quote.
  const quotes = studies.some(study => study.quote) ? ['quotes'] : []
  expect(await sections(page)).toEqual(['hero', 'proof', 'work', 'services', 'how', ...quotes, 'contact'])
  // The clock is part of the hero.
  await expect(section(page, 'hero').getByRole('complementary', { name: 'Shared working hours' })).toBeVisible()
})

test('every word of the sections comes from app/content', async ({ page }) => {
  await page.goto('/')
  const hero = section(page, 'hero')
  await expect(hero.getByText(profile.hero.label)).toBeVisible()
  await expect(hero.getByText(profile.hero.subline)).toBeVisible()
  await expect(hero.getByText(profile.replyPromise)).toBeVisible()
  for (const path of profile.hero.paths) {
    await expect(hero.getByRole('link', { name: path.label })).toHaveAttribute('href', path.to)
  }
  await expect(hero.getByRole('link', { name: 'See my work' })).toHaveAttribute('href', '/work')

  const proof = section(page, 'proof')
  await expect(proof.locator('.metric-tile__value')).toHaveText(profile.proofStrip.map(item => item.value))
  await expect(proof.locator('.metric-tile__label')).toHaveText(profile.proofStrip.map(item => item.label))

  const work = section(page, 'work')
  await expect(work.getByRole('heading', { level: 3 })).toHaveText(featured.map(study => study.title))
  await expect(work.getByRole('link', { name: `All ${studies.length} case studies` })).toHaveAttribute('href', '/work')

  const offer = section(page, 'services')
  await expect(offer.getByText(profile.pricing)).toBeVisible()
  await expect(offer.getByRole('heading', { level: 3 })).toHaveText(services.items.map(item => item.title))

  const how = section(page, 'how')
  await expect(how.locator('ol > li')).toHaveText(profile.howIWork.map((text, i) => `${String(i + 1).padStart(2, '0')}${text}`))
  await expect(how.locator('ul > li')).toHaveText(profile.aiRules)
})

test('each featured card opens its case study', async ({ page }) => {
  await page.goto('/')
  for (const study of featured) {
    await expect(section(page, 'work').getByRole('link', { name: study.title })).toHaveAttribute('href', `/work/${study.slug}`)
  }
  await section(page, 'work').getByRole('link', { name: featured[0]!.title }).click()
  await expect(page).toHaveURL(new RegExp(`/work/${featured[0]!.slug}/?$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(featured[0]!.title)
})

test('every link on the page goes somewhere real', async ({ page }) => {
  await page.goto('/')
  // After mount the contact block shows the booking link.
  await expect(section(page, 'contact').getByRole('link', { name: 'Book a 30-minute call' })).toBeVisible()
  const hrefs = [...new Set(await page.locator('a[href]').evaluateAll(links => links.map(link => link.getAttribute('href') ?? '')))]
  const outside = [profile.links.linkedin, profile.links.github, profile.links.upwork, profile.booking.url]
  for (const href of hrefs) {
    if (/^https?:/.test(href)) {
      // No network calls to real sites in tests: outside links must be the
      // profile's own links.
      expect(outside, href).toContain(href)
    }
    else if (href.startsWith('#')) {
      await expect(page.locator(href), href).toHaveCount(1)
    }
    else {
      expect(href, href).toMatch(/^\//)
      const response = await page.request.get(href)
      expect(response.status(), href).toBe(200)
    }
  }
})

test('a normal visit shows the booking button and the email in the contact section', async ({ page }) => {
  await page.goto('/')
  const contact = section(page, 'contact')
  await expect(contact.getByRole('link', { name: 'Book a 30-minute call' })).toHaveAttribute('href', profile.booking.url)
  await expect(contact.getByText(profile.email)).toBeVisible()
  await expect(contact.getByRole('link', { name: 'Message me on Upwork' })).toHaveCount(0)
})

test('opened from Upwork, the home page shows no email, booking link or phone', async ({ page }) => {
  const requests: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('contact-details')) requests.push(request.url())
  })
  await page.goto('/?from=upwork')
  await page.waitForLoadState('networkidle')
  const contact = section(page, 'contact')
  await expect(contact.getByRole('link', { name: 'Message me on Upwork' })).toHaveAttribute('href', profile.links.upwork)
  await expect(contact.getByText(profile.replyPromise)).toBeVisible()
  const html = await page.content()
  expect(html).not.toContain(profile.email)
  expect(html).not.toContain(profile.booking.url)
  expect(html).not.toContain('cal.com')
  expect(html).not.toContain('mailto:')
  expect(html).not.toContain('tel:')
  await expect(page.getByRole('link', { name: 'Book a 30-minute call' })).toHaveCount(0)
  expect(requests).toEqual([])
})

test('with JavaScript off, every section shows and the contact section is the Upwork version', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  expect(await sections(page)).toContain('contact')
  await expect(section(page, 'contact').getByRole('link', { name: 'Message me on Upwork' })).toBeVisible()
  expect(await page.content()).not.toContain(profile.email)
  await context.close()
})

test.describe('on a desktop', () => {
  test.use({ viewport: desktop })

  test('the clock sits beside the hero text', async ({ page }) => {
    await page.goto('/')
    const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
    const clock = await page.getByRole('complementary', { name: 'Shared working hours' }).boundingBox()
    expect(clock!.x).toBeGreaterThan(heading!.x + heading!.width)
  })
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('the clock sits below the hero text, and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/')
      const heading = await page.getByRole('heading', { level: 1 }).boundingBox()
      const clock = await page.getByRole('complementary', { name: 'Shared working hours' }).boundingBox()
      expect(clock!.y).toBeGreaterThan(heading!.y + heading!.height)
      await page.getByRole('heading', { name: 'Tell me what you are building' }).scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
    })
  })
}

test.describe('motion', () => {
  test('the hero fades up once', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.home-hero__text')).toHaveCSS('animation-name', /home-fade-up/)
  })

  test('there is no motion when the visitor asks for less', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await context.newPage()
    await page.goto('/')
    await expect(page.locator('.home-hero__text')).toHaveCSS('animation-name', 'none')
    await context.close()
  })
})
