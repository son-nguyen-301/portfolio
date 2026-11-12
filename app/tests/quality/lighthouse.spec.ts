// Lighthouse (mobile, its default settings) on every built page. The quality
// bar in docs/design.md: Performance 95+, Accessibility 100, Best Practices
// 100, SEO 100. Each page's scores go to test-results/quality/, and
// test-results/quality/lighthouse.md holds the table for the PR.
//
// Performance moves a little from run to run. When a page's first score is
// under the bar, Lighthouse runs twice more and the median of the three
// counts, as Lighthouse's own docs advise for noisy machines.
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { chromium, expect, test, type Browser } from '@playwright/test'
import lighthouse from 'lighthouse'
import { builtPages, missingPath } from './pages'
import { siteStats, statsDrift } from './stats'

const categories = ['performance', 'accessibility', 'best-practices', 'seo'] as const
type Category = typeof categories[number]
type Scores = Record<Category, number>

const minimum: Scores = {
  'performance': 95,
  'accessibility': 100,
  'best-practices': 100,
  'seo': 100,
}

// Lighthouse will not score a page sent with status 404, so the 404 page is
// scored at /404, where Workers sends the same file with status 200. That
// path is `noindex` (`_headers`, D-036): an error page must stay out of
// search, so SEO is not scored there. Its other three scores still count.
const notFoundPath = '/404'

// Lighthouse drives its own tab over the DevTools port.
const debugPort = Number(process.env.LIGHTHOUSE_PORT ?? 9334)
const out = join(import.meta.dirname, '../../test-results/quality')
let browser: Browser

test.beforeAll(async () => {
  browser = await chromium.launch({ args: [`--remote-debugging-port=${debugPort}`] })
})

test.afterAll(async () => {
  await browser?.close()
  // Every page tested so far, in this run (Playwright empties test-results
  // when a run starts). None when every audit failed before it wrote one.
  if (!existsSync(out)) return
  const results = readdirSync(out).filter(file => file.endsWith('.json'))
    .map(file => JSON.parse(readFileSync(join(out, file), 'utf8')) as { path: string, scores: Scores, runs: number[] })
    .sort((a, b) => a.path.localeCompare(b.path))
  const rows = results.map(({ path, scores, runs }) => {
    const performance = runs.length > 1 ? `${scores.performance} (median of ${runs.join(', ')})` : String(scores.performance)
    return `| \`${path}\` | ${performance} | ${scores.accessibility} | ${scores['best-practices']} | ${scores.seo} |`
  })
  writeFileSync(join(out, 'lighthouse.md'), [
    '| Page | Performance | Accessibility | Best Practices | SEO |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
  ].join('\n'))
})

async function audit(url: string) {
  const result = await lighthouse(url, {
    port: debugPort,
    output: 'json',
    logLevel: 'error',
    onlyCategories: [...categories],
  })
  expect(result, `Lighthouse ran on ${url}`).toBeTruthy()
  const lhr = result!.lhr
  expect(lhr.runtimeError, `Lighthouse error on ${url}`).toBeUndefined()
  const scores = Object.fromEntries(categories.map(id => [id, Math.round((lhr.categories[id]?.score ?? 0) * 100)])) as Scores
  // The audits that cost points, so a failure says what to fix.
  const failing = categories.flatMap(id => (lhr.categories[id]?.auditRefs ?? [])
    .filter(ref => ref.weight > 0)
    .map(ref => lhr.audits[ref.id]!)
    .filter(item => item.score !== null && item.score < 1 && item.scoreDisplayMode !== 'informative')
    .map(item => `${id}: ${item.id} (${item.score}) ${item.displayValue ?? ''}`.trim()))
  return { scores, failing }
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]!
}

for (const page of builtPages()) {
  const path = page === missingPath ? notFoundPath : page
  const scored = page === missingPath ? categories.filter(id => id !== 'seo') : categories

  test(`Lighthouse mobile scores on ${path}`, async ({ baseURL }) => {
    const url = new URL(path, baseURL).href
    const first = await audit(url)
    const runs = [first.scores.performance]
    const failing = first.failing
    let scores = first.scores
    if (scores.performance < minimum.performance) {
      for (let i = 0; i < 2; i++) runs.push((await audit(url)).scores.performance)
      scores = { ...scores, performance: median(runs) }
    }
    console.log(`${path}: ${JSON.stringify(scores)}${runs.length > 1 ? ` performance runs ${runs.join(', ')}` : ''}${failing.length ? `\n  ${failing.join('\n  ')}` : ''}`)

    mkdirSync(out, { recursive: true })
    const name = path === '/' ? 'home' : path.slice(1).replaceAll('/', '-')
    writeFileSync(join(out, `${name}.json`), JSON.stringify({ path, scores, runs }))

    for (const id of scored) expect.soft(scores[id], `${id} on ${path}; failing audits:\n${failing.join('\n')}`).toBeGreaterThanOrEqual(minimum[id])
    // The footer says "Lighthouse N" from content/profile.yml (D-039).
    if (path === '/') {
      expect.soft(Math.abs(scores.performance - siteStats.lighthouse), `siteStats.lighthouse in content/profile.yml is ${siteStats.lighthouse}; this run measured ${scores.performance}. Update it.`).toBeLessThanOrEqual(statsDrift)
    }
  })
}
