// The services page (PF-015, docs/design/Services.dc.html). Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const content = fileURLToPath(new URL('../../content', import.meta.url))
const read = (file: string) => parse(readFileSync(join(content, file), 'utf8'))
const profile = read('profile.yml') as {
  email: string
  booking: { url: string, label: string }
  links: { upwork: string }
  replyPromise: string
  pricing: string
  howIWork: string[]
  aiRules: string[]
  roles: string[]
}
const services = read('services.yml') as {
  intro: string
  groups: Array<{ name: string, note: string }>
  items: Array<{ id: string, group: string, title: string, summary: string, proof: string[] }>
}
// Case study titles by slug, from the front matter.
const titles = new Map(readdirSync(join(content, 'work'))
  .filter(file => file.endsWith('.md'))
  .map((file) => {
    const front = readFileSync(join(content, 'work', file), 'utf8').split(/^---$/m)[1] ?? ''
    return [file.replace(/\.md$/, ''), (parse(front) as { title: string }).title] as const
  }))

const phone = { width: 360, height: 740 }
const group = (page: Page, name: string) => page.locator(`[data-group="${name}"]`)
const service = (page: Page, id: string) => page.locator(`[data-service="${id}"]`)
const section = (page: Page, name: string) => page.locator(`[data-section="${name}"]`)
const block = (page: Page) => page.getByRole('region', { name: 'Contact details' })

test('the services page has its title, intro and pricing line', async ({ page }) => {
  const response = await page.goto('/services')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Services | Hai Son Nguyen')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Vue and Nuxt work, from a fix to a full app')
  await expect(page.locator('main .lead')).toHaveText(`${services.intro} ${profile.pricing}`)
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', `${services.intro} ${profile.pricing}`)
})

test('the 6 services sit under their groups, in the order of services.yml', async ({ page }) => {
  expect(services.items).toHaveLength(6)
  expect(services.groups.map(entry => entry.name)).toEqual(['Frontend', 'AI', 'Lead'])
  await page.goto('/services')
  await expect(page.locator('[data-group]')).toHaveCount(services.groups.length)
  for (const [i, entry] of services.groups.entries()) {
    const box = page.locator('[data-group]').nth(i)
    await expect(box).toHaveAttribute('data-group', entry.name)
    await expect(box.getByRole('heading', { level: 2 })).toHaveText(entry.name)
    await expect(box.getByText(entry.note)).toBeVisible()
    const items = services.items.filter(item => item.group === entry.name)
    await expect(box.getByRole('heading', { level: 3 })).toHaveText(items.map(item => item.title))
  }
  for (const item of services.items) {
    await expect(group(page, item.group).locator(`[data-service="${item.id}"] p`).first()).toHaveText(item.summary)
  }
})

test('every proof link names its case study and opens it', async ({ page }) => {
  await page.goto('/services')
  const seen = new Set<string>()
  for (const item of services.items) {
    const proof = service(page, item.id).getByRole('list', { name: 'Proof:' }).getByRole('link')
    await expect(proof).toHaveCount(item.proof.length)
    for (const [i, slug] of item.proof.entries()) {
      expect(titles.has(slug), `${item.id}: ${slug}`).toBe(true)
      await expect(proof.nth(i)).toHaveText(titles.get(slug)!)
      await expect(proof.nth(i)).toHaveAttribute('href', `/work/${slug}`)
      seen.add(slug)
    }
  }
  for (const slug of seen) {
    const response = await page.request.get(`/work/${slug}`)
    expect(response.status(), slug).toBe(200)
  }
  // One by a click, as a visitor does.
  const first = services.items[0]!
  await service(page, first.id).getByRole('link').first().click()
  await expect(page).toHaveURL(new RegExp(`/work/${first.proof[0]}/?$`))
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(titles.get(first.proof[0]!)!)
})

test('how a project starts, the AI rules and the note for full-time hiring', async ({ page }) => {
  await page.goto('/services')
  await expect(section(page, 'how').getByRole('listitem')).toHaveText(profile.howIWork.map((text, i) => `${String(i + 1).padStart(2, '0')}${text}`))
  await expect(section(page, 'ai').getByRole('listitem')).toHaveText(profile.aiRules)
  const roles = section(page, 'roles')
  await expect(roles.getByText('Senior Frontend Engineer (Vue and Nuxt), Frontend Lead, or Full-stack Engineer (frontend-heavy, Nuxt and Node). Remote, from UTC+7.')).toBeVisible()
  for (const role of profile.roles) await expect(roles).toContainText(role)
  await expect(roles.getByRole('link', { name: 'See my CV' })).toHaveAttribute('href', '/cv')
})

test('a normal visit shows the booking button and the email in the contact block', async ({ page }) => {
  await page.goto('/services')
  const contact = section(page, 'contact')
  await expect(contact.getByRole('heading', { level: 2 })).toHaveText('Get a fixed price')
  await expect(block(page).getByRole('link', { name: profile.booking.label })).toHaveAttribute('href', profile.booking.url)
  await expect(block(page).getByText(profile.email, { exact: true })).toBeVisible()
  await expect(block(page).getByText(profile.replyPromise)).toBeVisible()
})

test('Upwork mode shows no email, booking link or contact page link', async ({ page }) => {
  await page.goto('/services?from=upwork')
  await page.waitForLoadState('networkidle')
  const html = (await page.content()).toLowerCase()
  expect(html).not.toContain(profile.email.toLowerCase())
  expect(html).not.toContain('cal.com')
  expect(html).not.toContain('mailto:')
  await expect(page.locator('main a[href^="/contact"]:visible')).toHaveCount(0)
  await expect(block(page).getByRole('link', { name: 'Message me on Upwork' })).toHaveAttribute('href', profile.links.upwork)
  // The proof links stay: they are not contact details.
  await expect(service(page, services.items[0]!.id).getByRole('link').first()).toBeVisible()
})

test('the built page holds no email or booking link', async ({ request }) => {
  for (const path of ['/services', '/services/_payload.json']) {
    const text = (await (await request.get(path)).text()).toLowerCase()
    expect(text, path).not.toContain(profile.email.toLowerCase())
    expect(text, path).not.toContain('cal.com')
  }
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('one column, and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/services')
      const head = await group(page, 'Frontend').locator('.services__group-head').boundingBox()
      const first = await service(page, services.items[0]!.id).boundingBox()
      expect(first!.y).toBeGreaterThan(head!.y + head!.height)
      const steps = section(page, 'how').getByRole('listitem')
      const one = await steps.nth(0).boundingBox()
      const two = await steps.nth(1).boundingBox()
      expect(two!.y).toBeGreaterThan(one!.y + one!.height)
      await section(page, 'contact').scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
    })
  })
}

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('the group name sits beside its services, and the steps sit in one row', async ({ page }) => {
    await page.goto('/services')
    const head = await group(page, 'Frontend').locator('.services__group-head').boundingBox()
    const first = await service(page, services.items[0]!.id).boundingBox()
    expect(first!.x).toBeGreaterThan(head!.x + head!.width)
    expect(Math.abs(first!.y - head!.y)).toBeLessThan(4)
    const steps = section(page, 'how').getByRole('listitem')
    const one = await steps.nth(0).boundingBox()
    const last = await steps.last().boundingBox()
    expect(Math.abs(last!.y - one!.y)).toBeLessThan(1)
  })
})
