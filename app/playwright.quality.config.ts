import { defineConfig, devices } from '@playwright/test'

// `pnpm test:quality` (PF-022, docs/design.md: Quality bar): Lighthouse on
// every page, axe in both themes, no sideways scroll at 360 px, and the home
// page's JavaScript budget. Run `pnpm generate` first.
//
// The site is served by scripts/serve-built.ts, which compresses and sends
// the `_headers` like Cloudflare, because Lighthouse scores an uncompressed
// site far lower. One worker, so Lighthouse's timings never share the CPU
// with another test.
const port = Number(process.env.QUALITY_PORT ?? 4174)

export default defineConfig({
  testDir: 'tests/quality',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 120_000,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'node --experimental-strip-types scripts/serve-built.ts',
    url: `http://127.0.0.1:${port}`,
    env: { QUALITY_PORT: String(port) },
    reuseExistingServer: false,
  },
})
