// The home page loads less than 115 KB of JavaScript, as Cloudflare sends it:
// brotli (docs/design.md, Quality bar; Son's choice in PF-022, a ceiling that
// stops it growing: it was 109.5 KB when the check was added). It counts
// every script file the page downloads until the network is quiet, each at
// its brotli size. The output also lists the gzip size.
//
// Cloudflare compresses at brotli quality 4, not Node's default of 11: on
// 2026-11-12 the live site sent these files within 0.5% of their quality 4
// size (the small ones exactly). Quality 11 would count about 12% fewer bytes
// than visitors download.
//
// The budget is checked with Save-Data on. Once the browser is idle, Nuxt
// fetches the code of the pages that visible links point to, so a click
// opens them at once. That is not the home page's own code, and Nuxt skips it
// with Save-Data. The output also gives the size without Save-Data.
import { brotliCompressSync, constants, gzipSync } from 'node:zlib'
import { expect, test, type Page, type Response } from '@playwright/test'
import { siteStats, statsDrift } from './stats'

const budget = 115 * 1024
const cloudflareQuality = 4

function brotli(body: Buffer): number {
  return brotliCompressSync(body, { params: { [constants.BROTLI_PARAM_QUALITY]: cloudflareQuality } }).length
}

async function homeScripts(page: Page, saveData: boolean) {
  const scripts: Response[] = []
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') scripts.push(response)
  })
  if (saveData) {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } })
    })
  }
  await page.goto('/')
  await page.waitForLoadState('networkidle')
  const sizes = await Promise.all(scripts.map(async (response) => {
    const body = await response.body()
    return { url: new URL(response.url()).pathname, gzip: gzipSync(body).length, brotli: brotli(body) }
  }))
  return {
    sizes: sizes.sort((a, b) => b.brotli - a.brotli),
    gzip: sizes.reduce((sum, item) => sum + item.gzip, 0),
    brotli: sizes.reduce((sum, item) => sum + item.brotli, 0),
  }
}

const kb = (bytes: number) => `${(bytes / 1024).toFixed(1)} KB`

test('the home page loads under 115 KB of JavaScript, brotli', async ({ browser }) => {
  const ownPage = await browser.newPage()
  const own = await homeScripts(ownPage, true)
  await ownPage.close()
  const allPage = await browser.newPage()
  const all = await homeScripts(allPage, false)
  await allPage.close()
  const list = own.sizes.map(item => `${kb(item.brotli)} ${item.url}`)
  console.log([
    `Home page JavaScript: ${kb(own.brotli)} brotli (${kb(own.gzip)} gzip) in ${own.sizes.length} files.`,
    `With the idle-time fetch of linked pages: ${kb(all.brotli)} brotli (${kb(all.gzip)} gzip) in ${all.sizes.length} files.`,
    ...list.map(line => `  ${line}`),
  ].join('\n'))
  expect(own.sizes.length).toBeGreaterThan(0)
  expect(own.brotli, list.join('\n')).toBeLessThan(budget)
  // The footer says "N KB of JavaScript" from content/profile.yml (D-039).
  expect(Math.abs(own.brotli / 1024 - siteStats.javascriptKb), `siteStats.javascriptKb in content/profile.yml is ${siteStats.javascriptKb}; this run measured ${kb(own.brotli)}. Update it.`).toBeLessThanOrEqual(statsDrift)
})
