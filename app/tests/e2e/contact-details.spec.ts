// The email and the booking link must not reach a page opened from Upwork
// (CLAUDE.md hard rule 4). A page's content data is written into its built
// files, so this scans the generated site for them, Nuxt Content's copies of
// the collections included. Run `pnpm generate` first.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'
import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

const root = fileURLToPath(new URL('../..', import.meta.url))
const built = join(root, '.output/public')
const profile = parse(readFileSync(join(root, 'content/profile.yml'), 'utf8')) as { email: string, booking: { url: string, label: string } }

// The one file that holds them (app/utils/contact.ts). Only ContactBlock
// downloads it, after it has found that the visit is not in Upwork mode.
const contactFile = 'contact-details.json'

function files(dir: string, prefix = ''): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((item) => {
    const rel = prefix ? `${prefix}/${item.name}` : item.name
    return item.isDirectory() ? files(dir, rel) : [rel]
  })
}

// Nuxt Content's copies of the collections are gzip, then base64. Where they
// are depends on the preset: `__nuxt_content/<name>/sql_dump.txt` by default,
// `dump.<name>.sql` with the Cloudflare one. So any file that starts like
// gzip in base64 ("H4sI") is decoded, wherever it is.
function readBuilt(file: string): string {
  const text = readFileSync(join(built, file), 'utf8')
  return text.startsWith('H4sI') ? gunzipSync(Buffer.from(text.trim(), 'base64')).toString('utf8') : text
}

const [localPart] = profile.email.split('@') as [string]
const secrets: [string, string][] = [
  ['email', profile.email],
  ['email local part', localPart],
  ['email with %40', profile.email.replace('@', '%40')],
  ['email with &#64;', profile.email.replace('@', '&#64;')],
  ['mailto link', 'mailto:'],
  ['booking link', profile.booking.url],
  ['cal.com link', 'cal.com'],
]

test('no built file but the contact file holds the email or the booking link', () => {
  const scanned = files(built).filter(file => file !== contactFile)
  expect(scanned).toContain('_payload.json')
  expect(scanned.some(file => file.endsWith('/sql_dump.txt'))).toBe(true)
  const hits = scanned.flatMap((file) => {
    const text = readBuilt(file).toLowerCase()
    return secrets.filter(([, secret]) => text.includes(secret.toLowerCase())).map(([name]) => `${file}: ${name}`)
  })
  expect(hits).toEqual([])
})

test('the contact file holds only the email and the booking link', () => {
  const data = JSON.parse(readFileSync(join(built, contactFile), 'utf8'))
  expect(data).toEqual({ email: profile.email, booking: { url: profile.booking.url, label: profile.booking.label } })
})

test('the build has no copy of the profile collection', () => {
  expect(existsSync(join(built, '__nuxt_content/profile'))).toBe(false)
  expect(files(built).filter(file => /(^|\/)dump\.profile\./.test(file))).toEqual([])
})

test('the home page opened from Upwork shows no email or booking link', async ({ page }) => {
  await page.goto('/?from=upwork')
  await page.waitForLoadState('networkidle')
  const html = await page.content()
  expect(html).not.toContain(profile.email)
  expect(html).not.toContain(profile.booking.url)
})

// A content query in the browser downloads the whole profile collection, the
// email and the booking link included. 404.html has no prerendered page data,
// so it is the page where that would happen first.
test('no page downloads the profile collection', async ({ page }) => {
  const dumps: string[] = []
  page.on('request', (request) => {
    if (request.url().includes('/__nuxt_content/profile')) dumps.push(request.url())
  })
  for (const path of ['/', '/work/', '/services/', '/lab/', '/about/', '/cv/', '/contact/', '/404.html']) {
    await page.goto(path)
    await expect(page.getByRole('contentinfo')).toBeVisible()
  }
  // Pages opened from the 404 page by the header links.
  await page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Work' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Work')
  await page.getByRole('banner').getByRole('link', { name: 'Hai Son Nguyen' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Hai Son Nguyen')
  await page.waitForLoadState('networkidle')
  expect(dumps).toEqual([])
})
