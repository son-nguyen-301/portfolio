// The email and the booking link must not reach a page opened from Upwork
// (CLAUDE.md hard rule 4). A page's content data is written into its built
// files, so this scans the generated site for them. Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

const root = fileURLToPath(new URL('../..', import.meta.url))
const built = join(root, '.output/public')
const profile = parse(readFileSync(join(root, 'content/profile.yml'), 'utf8')) as { email: string, booking: { url: string } }

// Nuxt Content's compressed copies of each collection. They hold every field,
// contact details included, and are tracked in #34.
const skipped = ['__nuxt_content/']

function files(dir: string, prefix = ''): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true }).flatMap((item) => {
    const rel = prefix ? `${prefix}/${item.name}` : item.name
    return item.isDirectory() ? files(dir, rel) : [rel]
  })
}

test('no built page file holds the email or the booking link', () => {
  const secrets = [profile.email, profile.email.replace('@', '%40'), profile.booking.url]
  const scanned = files(built).filter(file => !skipped.some(part => file.startsWith(part)))
  expect(scanned).toContain('_payload.json')
  const hits = scanned.flatMap((file) => {
    const text = readFileSync(join(built, file), 'utf8')
    return secrets.filter(secret => text.includes(secret)).map(secret => `${file}: ${secret === profile.booking.url ? 'booking link' : 'email'}`)
  })
  expect(hits).toEqual([])
})

test('the home page shows no email or booking link', async ({ page }) => {
  await page.goto('/')
  const html = await page.content()
  expect(html).not.toContain(profile.email)
  expect(html).not.toContain(profile.booking.url)
})
