// The home page loads less than 100 KB of JavaScript, gzip
// (docs/design.md, Quality bar). It counts every script file the page
// downloads until the network is quiet, each at its gzip size. The output
// also lists the brotli size, which is what Cloudflare sends to browsers.
//
// The page runs with Save-Data on. Once the browser is idle, Nuxt fetches
// the code of the pages that visible links point to, so a click opens them
// at once. That is not the home page's own code, and Nuxt skips it with
// Save-Data, so it is not counted.
import { brotliCompressSync, gzipSync } from 'node:zlib'
import { expect, test, type Response } from '@playwright/test'

const budget = 100 * 1024

test('the home page loads under 100 KB of JavaScript, gzip', async ({ page }) => {
  const scripts: Response[] = []
  page.on('response', (response) => {
    if (response.request().resourceType() === 'script') scripts.push(response)
  })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'connection', { value: { saveData: true, effectiveType: '4g' } })
  })
  await page.goto('/')
  await page.waitForLoadState('networkidle')

  const sizes = await Promise.all(scripts.map(async (response) => {
    const body = await response.body()
    return { url: new URL(response.url()).pathname, gzip: gzipSync(body).length, brotli: brotliCompressSync(body).length }
  }))
  const gzip = sizes.reduce((sum, item) => sum + item.gzip, 0)
  const brotli = sizes.reduce((sum, item) => sum + item.brotli, 0)
  const list = sizes.sort((a, b) => b.gzip - a.gzip).map(item => `${(item.gzip / 1024).toFixed(1)} KB ${item.url}`)
  console.log(`Home page JavaScript: ${(gzip / 1024).toFixed(1)} KB gzip (${(brotli / 1024).toFixed(1)} KB brotli) in ${sizes.length} files\n  ${list.join('\n  ')}`)
  expect(sizes.length).toBeGreaterThan(0)
  expect(gzip, list.join('\n')).toBeLessThan(budget)
})
