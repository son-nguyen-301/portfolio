// The generated `_headers` file (PF-023, D-025) and the Content Security
// Policy in a real browser. sirv sends no `_headers`, so the browser tests add
// the policy from the built file to every page they open. Run `pnpm generate`
// first.
import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const root = fileURLToPath(new URL('../..', import.meta.url))
const built = join(root, '.output/public')
const profile = parse(readFileSync(join(root, 'content/profile.yml'), 'utf8')) as { email: string }

// Reads `_headers` the way Workers does: a path line, then indented
// "Name: value" lines, or "! Name" to drop a header a broader rule set.
function readRules(text: string) {
  const rules = new Map<string, { headers: Map<string, string>, detach: string[] }>()
  let current: { headers: Map<string, string>, detach: string[] } | undefined
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      current = { headers: new Map(), detach: [] }
      rules.set(line.trim(), current)
      continue
    }
    const detached = line.match(/^\s+!\s*(\S+)\s*$/)
    if (detached) {
      current!.detach.push(detached[1]!.toLowerCase())
      continue
    }
    const [, name, value] = line.match(/^\s+([^:]+):\s*(.*)$/) ?? []
    expect(name, `a header line in _headers: ${line}`).toBeTruthy()
    current!.headers.set(name!.trim().toLowerCase(), value!.trim())
  }
  return rules
}

const headersText = readFileSync(join(built, '_headers'), 'utf8')
const rules = readRules(headersText)
const all = rules.get('/*')?.headers ?? new Map<string, string>()
const policy = all.get('content-security-policy') ?? ''

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(item => item.isFile() && item.name.endsWith('.html'))
    .map(item => join(item.parentPath, item.name))
}

test('_headers sets the security headers on every path', () => {
  expect(all.get('strict-transport-security')).toMatch(/^max-age=\d{7,}/)
  expect(all.get('x-content-type-options')).toBe('nosniff')
  expect(all.get('referrer-policy')).toBe('strict-origin-when-cross-origin')
  expect(all.get('x-frame-options')).toBe('DENY')
  expect(all.get('cache-control')).toBe('public, max-age=0, must-revalidate')
  for (const part of [
    `default-src 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `worker-src 'self'`,
    `connect-src 'self' https://cloudflareinsights.com`,
  ]) expect(policy).toContain(part)
  expect(policy).toMatch(/script-src 'self' [^;]*https:\/\/static\.cloudflareinsights\.com/)
  expect(policy).not.toContain(`'unsafe-eval'`)
  expect(policy.match(/script-src[^;]*/)![0]).not.toContain(`'unsafe-inline'`)
})

test('_headers caches /_nuxt/ for a year and never caches the service worker', () => {
  expect(rules.get('/_nuxt/*')).toEqual({ headers: new Map([['cache-control', 'public, max-age=31536000, immutable']]), detach: ['cache-control'] })
  expect(rules.get('/_nuxt-skew-sw.js')).toEqual({ headers: new Map([['cache-control', 'no-cache']]), detach: ['cache-control'] })
  expect(rules.get('/contact-details.json')?.headers.get('x-robots-tag')).toBe('noindex')
})

test('_headers fits the Workers limits: 100 rules, 2,000 characters a line', () => {
  expect(rules.size).toBeLessThanOrEqual(100)
  for (const line of headersText.split('\n')) expect(line.length).toBeLessThanOrEqual(2000)
})

test('the policy lists the hash of every inline script in every built page', () => {
  const pages = htmlFiles(built)
  expect(pages.length).toBeGreaterThan(5)
  const missing: string[] = []
  for (const file of pages) {
    const html = readFileSync(file, 'utf8')
    for (const [, attrs, body] of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
      if (/\ssrc=/i.test(attrs!) || /type="application\/(?:ld\+)?json"/i.test(attrs!)) continue
      const hash = `'sha256-${createHash('sha256').update(body!).digest('base64')}'`
      if (!policy.includes(hash)) missing.push(`${file.slice(built.length)}: ${body!.slice(0, 40)}`)
    }
  }
  expect(missing).toEqual([])
})

test('no built page holds the analytics beacon while the token is empty', () => {
  const hits = htmlFiles(built).filter((file) => {
    const html = readFileSync(file, 'utf8')
    return html.includes('data-cf-beacon') || html.includes('cloudflareinsights')
  })
  expect(hits).toEqual([])
})

// Workers sends 404.html for a path that is not there (wrangler.jsonc); sirv
// does not, so the test opens the file itself.
// Opens a page with the built policy on every document, and collects every
// script, style or connection the policy blocks.
async function openWithPolicy(page: Page, path: string) {
  await page.route('**/*', async (route) => {
    if (route.request().resourceType() !== 'document') return route.continue()
    const response = await route.fetch()
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': policy } })
  })
  await page.addInitScript(() => {
    const seen: string[] = []
    ;(window as unknown as { cspViolations: string[] }).cspViolations = seen
    document.addEventListener('securitypolicyviolation', (event) => {
      seen.push(`${event.effectiveDirective}: ${event.blockedURI || 'inline'}`)
    })
  })
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error' && /Content Security Policy/i.test(message.text())) errors.push(message.text())
  })
  const response = await page.goto(path)
  return { response, errors }
}

const violations = (page: Page) => page.evaluate(() => (window as unknown as { cspViolations: string[] }).cspViolations)

for (const path of ['/', '/work/', '/about/', '/cv/', '/404.html']) {
  test(`${path} runs under the policy with nothing blocked`, async ({ page }) => {
    const { errors } = await openWithPolicy(page, path)
    // The head scripts and the app ran: the theme switch is live after mount.
    const dark = page.getByRole('contentinfo').getByRole('group', { name: 'Theme' }).getByRole('button', { name: 'Dark' })
    await dark.click()
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
    expect(await violations(page)).toEqual([])
    expect(errors).toEqual([])
  })
}

test('the contact block loads the email under the policy', async ({ page }) => {
  const { errors } = await openWithPolicy(page, '/contact/')
  await expect(page.getByRole('region', { name: 'Contact details' }).getByText(profile.email, { exact: true })).toBeVisible()
  expect(await violations(page)).toEqual([])
  expect(errors).toEqual([])
})

test('the Upwork head script runs under the policy', async ({ page }) => {
  const { errors } = await openWithPolicy(page, '/?from=upwork')
  await expect(page.locator('html')).toHaveAttribute('data-upwork', '')
  expect(await violations(page)).toEqual([])
  expect(errors).toEqual([])
})
