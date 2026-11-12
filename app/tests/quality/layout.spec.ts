// No sideways scroll at 360 px on any built page, in light and dark
// (docs/design.md, Quality bar).
import { expect, test } from '@playwright/test'
import { builtPages } from './pages'

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`360 px, ${colorScheme}`, () => {
    test.use({ colorScheme, viewport: { width: 360, height: 740 } })

    for (const path of builtPages()) {
      test(`no sideways scroll on ${path}`, async ({ page }) => {
        await page.goto(path)
        await page.waitForLoadState('networkidle')
        const width = await page.evaluate(() => document.documentElement.scrollWidth)
        expect(width).toBeLessThanOrEqual(360)
      })
    }
  })
}
