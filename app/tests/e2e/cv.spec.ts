// The CV page and its PDF (PF-018, docs/design/CV.dc.html, docs/architecture.md:
// CV PDF). Run `pnpm generate` first.
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { parse } from 'yaml'
import { pdfText } from '../pdf'

const app = fileURLToPath(new URL('../..', import.meta.url))
const read = (file: string) => parse(readFileSync(join(app, 'content', file), 'utf8'))
const profile = read('profile.yml') as {
  name: string
  title: string
  location: string
  utcOffset: number
  email: string
  booking: { url: string }
  links: { linkedin: string, github: string, upwork: string }
  hero: { subline: string }
  languages: string[]
  openTo: string[]
  roles: string[]
}
const timeline = read('timeline.yml') as {
  jobs: Array<{ role: string, company: string, location: string, points: string[] }>
  education: Array<{ school: string, field: string, start: string, end: string }>
}
const skills = read('skills.yml') as { groups: Array<{ name: string, items: string[] }> }

const pdfPath = '/cv/hai-son-nguyen-cv.pdf'
const builtPdf = join(app, '.output/public', pdfPath)
const phone = { width: 360, height: 740 }

// Text with no white space, so line breaks in the PDF don't count.
const squash = (text: string) => text.replace(/\s+/g, '')

// A phone number: 8 or more digits, with only spaces, dots, dashes, slashes
// or brackets between them, and maybe a + in front. Years and counts on the
// CV ("2015 to 2018", "379 pull requests") are never that long.
const phoneNumber = /\+?\d(?:[\s.\-/()]*\d){7,}/

test.describe('a normal visit', () => {
  test('shows the name, title, links, email and the PDF link', async ({ page }) => {
    const response = await page.goto('/cv')
    expect(response?.status()).toBe(200)
    await expect(page).toHaveTitle(`CV | ${profile.name}`)
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', profile.hero.subline)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(profile.name)
    await expect(page.locator('.cv__title')).toHaveText(`${profile.title} · ${profile.location} (UTC+${profile.utcOffset})`)
    await expect(page.locator('.cv__email')).toHaveText(profile.email)
    const links = page.getByRole('list', { name: 'Links' })
    await expect(links.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', profile.links.linkedin)
    await expect(links.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', profile.links.github)
    await expect(links.getByRole('link', { name: 'me.haisonnguyen.dev' })).toHaveAttribute('href', 'https://me.haisonnguyen.dev')
    await expect(links.getByRole('link', { name: 'Upwork' })).toBeHidden()
    const download = page.getByRole('link', { name: 'Download PDF' })
    await expect(download).toHaveAttribute('href', pdfPath)
    await expect(download).toHaveAttribute('download', '')
    await expect(page.getByRole('button', { name: 'Print' })).toBeVisible()
  })

  test('shows the roles, summary, jobs, skills, education and languages from content', async ({ page }) => {
    await page.goto('/cv')
    await expect(page.getByRole('heading', { level: 2 })).toHaveText(['Looking for', 'Summary', 'Experience', 'Skills', 'Education', 'Languages'])
    const section = (name: string) => page.getByRole('region', { name })
    await expect(section('Looking for').locator('p')).toHaveText([profile.roles.join(' · '), profile.openTo.join(' · ')])
    await expect(section('Summary')).toContainText(profile.hero.subline)
    const jobs = section('Experience').locator('.timeline__entry')
    await expect(jobs).toHaveCount(timeline.jobs.length)
    for (const [i, job] of timeline.jobs.entries()) {
      await expect(jobs.nth(i).getByRole('heading', { level: 3 })).toHaveText(job.role)
      await expect(jobs.nth(i).locator('.timeline__place')).toHaveText(`${job.company} · ${job.location}`)
      await expect(jobs.nth(i).locator('.timeline__points li')).toHaveText(job.points)
    }
    await expect(section('Skills').locator('dt')).toHaveText(skills.groups.map(group => group.name))
    await expect(section('Skills').locator('dd')).toHaveText(skills.groups.map(group => group.items.join(' · ')))
    await expect(section('Education').locator('p')).toHaveText(timeline.education.map(school =>
      `${school.school}, ${school.field}, ${school.start.slice(0, 4)} to ${school.end.slice(0, 4)}`))
    await expect(section('Languages')).toContainText(profile.languages.join(' · '))
  })

  test('the PDF link serves the PDF', async ({ request }) => {
    const response = await request.get(pdfPath)
    expect(response.status()).toBe(200)
    expect(response.headers()['content-type']).toBe('application/pdf')
    expect((await response.body()).subarray(0, 5).toString()).toBe('%PDF-')
  })

  test('prints only the CV: no header, footer or buttons', async ({ page }) => {
    await page.goto('/cv')
    await expect(page.locator('.cv__email')).toHaveText(profile.email)
    await page.emulateMedia({ media: 'print' })
    await expect(page.getByRole('banner')).toBeHidden()
    await expect(page.getByRole('contentinfo')).toBeHidden()
    await expect(page.getByRole('link', { name: 'Download PDF' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Print' })).toBeHidden()
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })
})

test.describe('printed in the dark theme', () => {
  test.use({ colorScheme: 'dark' })

  test('uses the light colors', async ({ page }) => {
    await page.goto('/cv')
    const color = () => page.locator('h1').evaluate(el => getComputedStyle(el).color)
    expect(await color()).toBe('rgb(230, 235, 240)')
    await page.emulateMedia({ media: 'print' })
    expect(await color()).toBe('rgb(20, 26, 34)')
  })
})

test.describe('Upwork mode', () => {
  test('/cv?from=upwork shows no email, no PDF link and no LinkedIn, and downloads no contact file', async ({ page }) => {
    const requests: string[] = []
    page.on('request', request => requests.push(request.url()))
    await page.goto('/cv?from=upwork')
    await page.waitForLoadState('networkidle')
    const links = page.getByRole('list', { name: 'Links' })
    await expect(links.getByRole('link', { name: 'Upwork' })).toHaveAttribute('href', profile.links.upwork)
    await expect(links.getByRole('link', { name: 'Upwork' })).toBeVisible()
    await expect(links.getByRole('link', { name: 'LinkedIn' })).toBeHidden()
    await expect(page.getByRole('button', { name: 'Print' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0)
    const html = await page.content()
    expect(html).not.toContain(profile.email)
    expect(html).not.toContain(pdfPath)
    expect(requests.filter(url => url.includes('contact-details') || url.includes('.pdf'))).toEqual([])
  })

  test('stays on when the CV is opened from another page of the visit', async ({ page }) => {
    await page.goto('/?from=upwork')
    await page.getByRole('contentinfo').getByRole('link', { name: 'CV' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(profile.name)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('link', { name: 'Download PDF' })).toHaveCount(0)
    expect(await page.content()).not.toContain(profile.email)
  })
})

// The built page is what a visit with JavaScript off, or any visit before the
// app starts, gets. It holds no email and no link to the PDF (D-033).
test('the built page and its data hold no email and no PDF link', async ({ request }) => {
  for (const path of ['/cv', '/cv/_payload.json', '/cv.md']) {
    const response = await request.get(path)
    expect(response.status(), path).toBe(200)
    const text = (await response.text()).toLowerCase()
    expect(text, path).not.toContain(profile.email.toLowerCase())
    expect(text, path).not.toContain(pdfPath)
    expect(text, path).not.toContain('cal.com')
  }
})

test.describe('the PDF', () => {
  test('was made from the current /cv page', async ({ page }) => {
    expect(existsSync(builtPdf)).toBe(true)
    await page.goto('/cv')
    await expect(page.locator('.cv__email')).toHaveText(profile.email)
    await page.emulateMedia({ media: 'print' })
    const printed = await page.locator('main').innerText()
    // If this fails, the content changed: run `pnpm generate`, `pnpm cv:pdf`,
    // then `pnpm generate` again, and commit the new PDF.
    expect(squash(await pdfText(builtPdf))).toBe(squash(printed))
  })

  test('shows the email but no phone number and no booking link', async () => {
    const text = await pdfText(builtPdf)
    expect(text).toContain(profile.email)
    expect(text).toContain(profile.name)
    for (const job of timeline.jobs) expect(squash(text)).toContain(squash(job.company))
    expect(text).not.toMatch(phoneNumber)
    expect(text).not.toContain(profile.booking.url)
    expect(text.toLowerCase()).not.toContain('cal.com')
  })

  test('the phone number check catches phone numbers', () => {
    for (const sample of ['+84 912 345 678', '0912.345.678', '(555) 123-4567', '+1 555 123 4567']) expect(sample).toMatch(phoneNumber)
    for (const sample of ['2015 to 2018', 'merged 379 pull requests', 'Sep 2024 to now', 'UTC+7']) expect(sample).not.toMatch(phoneNumber)
  })
})

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a phone, ${colorScheme}`, () => {
    test.use({ viewport: phone, colorScheme })

    test('one column, and nothing scrolls sideways', async ({ page }) => {
      await page.goto('/cv')
      await expect(page.locator('.cv__email')).toHaveText(profile.email)
      const section = page.getByRole('region', { name: 'Experience' })
      const label = await section.getByRole('heading', { level: 2 }).boundingBox()
      const body = await section.locator('.cv__body').boundingBox()
      expect(body!.y).toBeGreaterThan(label!.y + label!.height)
      await page.getByRole('region', { name: 'Languages' }).scrollIntoViewIfNeeded()
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(phone.width)
    })
  })
}

test('on a desktop, the labels sit in a column beside the text', async ({ page }) => {
  await page.goto('/cv')
  const section = page.getByRole('region', { name: 'Experience' })
  const label = await section.getByRole('heading', { level: 2 }).boundingBox()
  const body = await section.locator('.cv__body').boundingBox()
  expect(body!.x).toBeGreaterThan(label!.x + label!.width)
  expect(Math.abs(body!.y - label!.y)).toBeLessThan(10)
})
