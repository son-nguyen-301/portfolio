// `pnpm cv:pdf` (PF-018, docs/architecture.md: CV PDF). Prints the built /cv
// page to public/cv/hai-son-nguyen-cv.pdf with Playwright's Chromium.
//
// Run `pnpm generate` first, then this, then commit the PDF: Cloudflare's
// build has no browser. The PDF is the normal visit (not Upwork mode) in the
// light theme, so it shows the email. It never shows a phone number: the
// content has none, and tests/e2e/cv.spec.ts checks the PDF's text.
//
// Run `pnpm generate` once more after this, so .output/public has the new PDF
// for the browser tests.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from '@playwright/test'

const root = fileURLToPath(new URL('..', import.meta.url))
const built = join(root, '.output/public')
const out = join(root, 'public/cv/hai-son-nguyen-cv.pdf')
// Not the browser tests' port (4173), so both can run at once.
const port = Number(process.env.CV_PDF_PORT ?? 4183)
const base = `http://127.0.0.1:${port}`

if (!existsSync(join(built, 'cv/index.html'))) {
  console.error('No built /cv page. Run `pnpm generate` first.')
  process.exit(1)
}

// The same server as the browser tests (playwright.config.ts).
const server = spawn(join(root, 'node_modules/.bin/sirv'), [built, '--host', '127.0.0.1', '--port', String(port), '--quiet'], {
  env: { ...process.env, HOST: '127.0.0.1', PORT: String(port) },
  stdio: 'inherit',
})

async function waitForServer(): Promise<void> {
  for (let i = 0; i < 100; i++) {
    if (server.exitCode !== null) throw new Error(`The server stopped (port ${port} busy?)`)
    try {
      const response = await fetch(`${base}/cv`)
      if (response.ok) return
    }
    catch {
      // Not up yet.
    }
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  throw new Error('The server did not start')
}

try {
  await waitForServer()
  const browser = await chromium.launch()
  try {
    const context = await browser.newContext({ colorScheme: 'light' })
    const page = await context.newPage()
    await page.goto(`${base}/cv`)
    // The email comes after mount, from /contact-details.json.
    await page.locator('.cv__email span').waitFor()
    await page.evaluate(() => document.fonts.ready)
    await page.emulateMedia({ media: 'print' })
    mkdirSync(dirname(out), { recursive: true })
    // @page in base.css sets A4 and the margins.
    await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true, tagged: true, outline: true })
    console.log(`Wrote ${out}`)
  }
  finally {
    await browser.close()
  }
}
finally {
  server.kill()
}
