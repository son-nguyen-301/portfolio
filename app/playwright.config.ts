import { defineConfig, devices } from '@playwright/test'

// Browser tests run against the generated site in .output/public, served by
// sirv on this machine. Run `pnpm generate` first. No network at test time.
// Set E2E_PORT to run two test runs at once. A busy port fails the run, so a
// run never tests another run's server.
const port = Number(process.env.E2E_PORT ?? 4173)

export default defineConfig({
  testDir: 'tests/e2e',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    trace: 'off',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `sirv .output/public --host 127.0.0.1 --port ${port} --quiet`,
    url: `http://127.0.0.1:${port}`,
    // sirv reads HOST and PORT from the environment before its flags.
    env: { HOST: '127.0.0.1', PORT: String(port) },
    reuseExistingServer: false,
  },
})
