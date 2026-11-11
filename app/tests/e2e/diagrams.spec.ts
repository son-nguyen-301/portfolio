// The case study diagrams (PF-014). Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { parse } from 'yaml'

const content = fileURLToPath(new URL('../../content', import.meta.url))
type Media = { type: string, src?: string, alt: string }
const studies = readdirSync(join(content, 'work'))
  .filter(file => file.endsWith('.md'))
  .map((file) => {
    const front = readFileSync(join(content, 'work', file), 'utf8').split(/^---$/m)[1] ?? ''
    const { media } = parse(front) as { media: Media[] }
    return { slug: file.replace(/\.md$/, ''), diagrams: media.filter(item => item.type === 'diagram') }
  })
  .filter(study => study.diagrams.length)

// Every <text> of every diagram, measured in its SVG's own units after the
// fonts load, so a word that runs out of the drawing shows up.
async function textOutside(page: Page) {
  await page.evaluate(() => document.fonts.ready)
  return page.locator('[data-section="media"] svg.diagram').evaluateAll(svgs => svgs.flatMap((svg) => {
    const box = (svg as SVGSVGElement).viewBox.baseVal
    return [...svg.querySelectorAll('text')].flatMap((text) => {
      const b = text.getBBox()
      const inside = b.x >= box.x && b.y >= box.y && b.x + b.width <= box.x + box.width && b.y + b.height <= box.y + box.height
      return inside ? [] : [text.textContent]
    })
  }))
}

test('five case studies have a diagram', () => {
  expect(studies).toHaveLength(5)
})

for (const study of studies) {
  test(`${study.slug} shows its diagram, with its alt text as the title`, async ({ page }) => {
    await page.goto(`/work/${study.slug}`)
    const media = page.locator('[data-section="media"]')
    await expect(media.locator('[data-media="placeholder"]')).toHaveCount(0)
    for (const item of study.diagrams) {
      const svg = media.getByRole('img', { name: item.alt, exact: true })
      await expect(svg).toBeVisible()
      await expect(svg).toHaveClass(/diagram/)
      await expect(svg.locator('title')).toHaveText(item.alt)
    }
    expect(await textOutside(page)).toEqual([])
  })
}

for (const colorScheme of ['light', 'dark'] as const) {
  test.describe(`on a 360 px phone, ${colorScheme}`, () => {
    test.use({ viewport: { width: 360, height: 740 }, colorScheme })

    test('every diagram fits, keeps its words inside, and draws text in the ink color', async ({ page }) => {
      for (const study of studies) {
        await page.goto(`/work/${study.slug}`)
        const svg = page.locator('[data-section="media"] svg.diagram').first()
        await svg.scrollIntoViewIfNeeded()
        const box = await svg.boundingBox()
        expect(box!.x, study.slug).toBeGreaterThanOrEqual(0)
        expect(box!.x + box!.width, study.slug).toBeLessThanOrEqual(360)
        expect(await page.evaluate(() => document.documentElement.scrollWidth), study.slug).toBeLessThanOrEqual(360)
        expect(await textOutside(page), study.slug).toEqual([])
        const [fill, ink] = await svg.evaluate(node => [
          getComputedStyle(node.querySelector('text:not(.diagram__label)')!).fill,
          getComputedStyle(document.body).color,
        ])
        expect(fill, study.slug).toBe(ink)
      }
    })
  })
}

test('diagrams stay at most 400 px wide on a desktop', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 })
  for (const study of studies) {
    await page.goto(`/work/${study.slug}`)
    const box = await page.locator('[data-section="media"] svg.diagram').first().boundingBox()
    expect(box!.width, study.slug).toBeLessThanOrEqual(400)
  }
})
