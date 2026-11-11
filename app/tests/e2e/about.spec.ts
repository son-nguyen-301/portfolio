// The About placeholder shows the career list with Timeline (#73), so a built
// page uses it and `pnpm generate` proves its imports work in the server build.
// Run `pnpm generate` first.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

const timeline = parse(readFileSync(fileURLToPath(new URL('../../content/timeline.yml', import.meta.url)), 'utf8')) as {
  jobs: Array<{ role: string, company: string, start: string, end: string | null }>
}

test('the built About page lists every job from timeline.yml, newest first', async ({ page }) => {
  await page.goto('/about/')
  const career = page.getByRole('region', { name: 'Career' })
  const entries = career.locator('.timeline__entry')
  await expect(entries).toHaveCount(timeline.jobs.length)
  await expect(career.getByRole('heading', { level: 3 })).toHaveText(timeline.jobs.map(job => job.role))
  await expect(entries.locator('.timeline__place')).toHaveText(timeline.jobs.map(job => new RegExp(`^${job.company} · `)))
})

test('the dates are written in the built HTML, not only after mount', async ({ request }) => {
  const html = await (await request.get('/about/')).text()
  const current = timeline.jobs.find(job => job.end === null)
  expect(current).toBeDefined()
  expect(html).toContain(`datetime="${current!.start}"`)
  // "Sep 2024 to now", with Vue's scoped-style attributes on the tags.
  expect(html).toMatch(/>[A-Z][a-z]{2} \d{4}<\/time>\s*to\s*<span[^>]*>now<\/span>/)
})
