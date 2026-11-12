// axe on every built page, on a phone and a desktop, in light and dark. No
// serious or critical issue may be left (#48). Smaller issues are listed in
// the test output, so they can be fixed too.
import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { builtPages } from './pages'

const viewports = {
  phone: { width: 360, height: 740 },
  desktop: { width: 1280, height: 800 },
}

for (const colorScheme of ['light', 'dark'] as const) {
  for (const [device, viewport] of Object.entries(viewports)) {
    test.describe(`${device}, ${colorScheme}`, () => {
      test.use({ colorScheme, viewport })

      for (const path of builtPages()) {
        test(`axe finds no serious issue on ${path}`, async ({ page }) => {
          await page.goto(path)
          await page.waitForLoadState('networkidle')
          const { violations } = await new AxeBuilder({ page }).analyze()
          const lines = violations.map(item => `${item.impact}: ${item.id} (${item.nodes.length}) ${item.nodes.slice(0, 3).map(node => node.target.join(' ')).join(', ')}`)
          if (lines.length) console.log(`${path} ${device} ${colorScheme}:\n  ${lines.join('\n  ')}`)
          const serious = violations.filter(item => item.impact === 'serious' || item.impact === 'critical')
          expect(serious.map(item => item.id), lines.join('\n')).toEqual([])
        })
      }
    })
  }
}
