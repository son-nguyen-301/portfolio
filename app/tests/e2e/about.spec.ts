// The about page (PF-016, docs/design/About.dc.html). It shows the career list
// with Timeline, so `pnpm generate` also proves the component's imports work
// in the server build (#73). Run `pnpm generate` first.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const content = fileURLToPath(new URL('../../content', import.meta.url))
const read = (file: string) => parse(readFileSync(join(content, file), 'utf8'))
const profile = read('profile.yml') as {
  email: string
  booking: { url: string }
  links: { upwork: string }
  about: string
  location: string
  hours: { label: string }
  languages: string[]
  openTo: string[]
  roles: string[]
}
const timeline = read('timeline.yml') as {
  jobs: Array<{ role: string, company: string, start: string, end: string | null }>
  education: Array<{ school: string, field: string, start: string, end: string }>
}
const skills = read('skills.yml') as { groups: Array<{ name: string, items: string[] }> }
const earlier = read('earlier.yml') as { aspire: string[], xtel: Array<{ name: string, summary: string }> }

// The about text as one line per paragraph.
const paragraphs = profile.about.split(/\n\s*\n/).map(text => text.replace(/\s+/g, ' ').trim()).filter(Boolean)
const [headline, ...firstRest] = paragraphs[0]!.split(/\.\s+/)

// A company name may hold ".", "(" or "+", which mean something in a RegExp.
const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const phone = { width: 360, height: 740 }
const career = (page: Page) => page.getByRole('region', { name: 'Career' })

test('the about page shows the about text with its first sentence as the title', async ({ page }) => {
  const response = await page.goto('/about')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('About | Hai Son Nguyen')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(headline!)
  await expect(page.locator('.about__paragraphs p')).toHaveText([firstRest.join('. '), ...paragraphs.slice(1)])
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', paragraphs[0]!)
})

test('the facts box shows the place, hours, languages, what Son is open to and the roles', async ({ page }) => {
  await page.goto('/about')
  const box = page.locator('dl.about__facts')
  await expect(box.locator('dt')).toHaveText(['Based in', 'Working hours', 'Languages', 'Open to', 'Roles'])
  await expect(box.locator('dd')).toHaveText([
    `${profile.location} (UTC+7)`,
    profile.hours.label,
    ...profile.languages,
    ...profile.openTo,
    ...profile.roles,
  ])
})

test('the career list shows every job, newest first, then education', async ({ page }) => {
  await page.goto('/about/')
  const entries = career(page).locator('.timeline__entry')
  await expect(entries).toHaveCount(timeline.jobs.length + timeline.education.length)
  await expect(career(page).locator('.timeline').getByRole('heading', { level: 3 })).toHaveText([
    ...timeline.jobs.map(job => job.role),
    ...timeline.education.map(school => school.field),
  ])
  await expect(entries.locator('.timeline__place')).toHaveText([
    ...timeline.jobs.map(job => new RegExp(`^${escape(job.company)} · `)),
    ...timeline.education.map(school => school.school),
  ])
  await expect(career(page).getByRole('link', { name: 'See it as a CV →' })).toHaveAttribute('href', '/cv')
})

test('the dates are written in the built HTML, not only after mount', async ({ request }) => {
  const html = await (await request.get('/about/')).text()
  const current = timeline.jobs.find(job => job.end === null)
  expect(current).toBeDefined()
  expect(html).toContain(`datetime="${current!.start}"`)
  // "Sep 2024 to now", with Vue's scoped-style attributes on the tags.
  expect(html).toMatch(/>[A-Z][a-z]{2} \d{4}<\/time>\s*to\s*<span[^>]*>now<\/span>/)
  for (const school of timeline.education) expect(html).toContain(`datetime="${school.end}"`)
})

test('the "Also at Aspire" list shows every line of earlier.yml', async ({ page }) => {
  await page.goto('/about')
  const aspire = page.locator('[data-section="aspire"]')
  await expect(aspire.getByRole('heading', { level: 3 })).toHaveText('Also at Aspire')
  await expect(aspire.getByRole('list', { name: 'Also at Aspire' }).getByRole('listitem')).toHaveText(earlier.aspire)
})

test('the skill groups show every skill as its own tag', async ({ page }) => {
  await page.goto('/about')
  const groups = page.getByRole('region', { name: 'Skills' }).locator('[data-group]')
  await expect(groups).toHaveCount(skills.groups.length)
  for (const [i, group] of skills.groups.entries()) {
    await expect(groups.nth(i).getByRole('heading', { level: 3 })).toHaveText(group.name)
    await expect(groups.nth(i).getByRole('list', { name: group.name }).getByRole('listitem')).toHaveText(group.items)
  }
  // One tag, with commas inside it.
  await expect(page.getByRole('listitem').filter({ hasText: /^Plugins, skills and subagents$/ })).toHaveCount(1)
})

test('the earlier projects section has the id `earlier` and every XTEL project', async ({ page }) => {
  await page.goto('/about')
  const section = page.locator('section#earlier')
  await expect(section.getByRole('heading', { level: 2 })).toHaveText('Earlier projects')
  await expect(section.getByText('XTEL, 2019 to 2021', { exact: true })).toBeVisible()
  await expect(section.getByRole('heading', { level: 3 })).toHaveText(earlier.xtel.map(project => project.name))
  await expect(section.locator('.about__project p')).toHaveText(earlier.xtel.map(project => project.summary))
})

test('"Earlier projects →" on /work lands on the earlier projects section', async ({ page }) => {
  await page.goto('/work')
  await page.getByRole('link', { name: 'Earlier projects' }).click()
  await expect(page).toHaveURL(/\/about\/?#earlier$/)
  const heading = page.locator('section#earlier').getByRole('heading', { level: 2 })
  await expect(heading).toBeInViewport()
})

test('Upwork mode shows no email, booking link or contact page link', async ({ page }) => {
  await page.goto('/about?from=upwork')
  await page.waitForLoadState('networkidle')
  const html = (await page.content()).toLowerCase()
  expect(html).not.toContain(profile.email.toLowerCase())
  expect(html).not.toContain('cal.com')
  expect(html).not.toContain('mailto:')
  await expect(page.locator('main a[href^="/contact"]:visible')).toHaveCount(0)
})

test('the built page holds no email or booking link', async ({ request }) => {
  for (const path of ['/about', '/about/_payload.json']) {
    const text = (await (await request.get(path)).text()).toLowerCase()
    expect(text, path).not.toContain(profile.email.toLowerCase())
    expect(text, path).not.toContain('cal.com')
  }
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('one column, and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/about')
      const text = await page.locator('.about__text').boundingBox()
      const box = await page.locator('dl.about__facts').boundingBox()
      expect(box!.y).toBeGreaterThan(text!.y + text!.height)
      const projects = page.locator('.about__project')
      const one = await projects.nth(0).boundingBox()
      const two = await projects.nth(1).boundingBox()
      expect(two!.y).toBeGreaterThan(one!.y + one!.height)
      await page.locator('section#earlier').scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
    })
  })
}

test.describe('on a desktop', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('the facts box sits beside the text, and the dates beside each job', async ({ page }) => {
    await page.goto('/about')
    const text = await page.locator('.about__text').boundingBox()
    const box = await page.locator('dl.about__facts').boundingBox()
    expect(box!.x).toBeGreaterThan(text!.x + text!.width)
    const first = career(page).locator('.timeline__entry').first()
    const when = await first.locator('.timeline__when').boundingBox()
    const role = await first.getByRole('heading', { level: 3 }).boundingBox()
    expect(role!.x).toBeGreaterThan(when!.x + when!.width)
    expect(Math.abs(role!.y - when!.y)).toBeLessThan(16)
  })
})
