// Text checks for the inline SVG diagrams (PF-014, PF-059, PF-060), shared by
// the case study and Lab tests. `selector` finds the diagrams on the page.
import type { Page } from '@playwright/test'

// Every pair of <text> boxes in one diagram that overlap, after the fonts load,
// so two labels that run into each other show up. A text box is taller than
// its letters, so two stacked lines may share up to 3 units.
export async function textOverlaps(page: Page, selector: string) {
  await page.evaluate(() => document.fonts.ready)
  return page.locator(selector).evaluateAll(svgs => svgs.flatMap((svg) => {
    const boxes = [...svg.querySelectorAll('text')].map(text => ({ text: text.textContent, b: text.getBBox() }))
    return boxes.flatMap((one, i) => boxes.slice(i + 1)
      .filter(({ b }) => one.b.x < b.x + b.width && b.x < one.b.x + one.b.width
        && Math.min(one.b.y + one.b.height, b.y + b.height) - Math.max(one.b.y, b.y) > 3)
      .map(other => `${one.text} | ${other.text}`))
  }))
}

// Every <text> of every diagram, measured in its SVG's own units after the
// fonts load, so a word that runs out of the drawing shows up.
export async function textOutside(page: Page, selector: string) {
  await page.evaluate(() => document.fonts.ready)
  return page.locator(selector).evaluateAll(svgs => svgs.flatMap((svg) => {
    const box = (svg as SVGSVGElement).viewBox.baseVal
    return [...svg.querySelectorAll('text')].flatMap((text) => {
      const b = text.getBBox()
      const inside = b.x >= box.x && b.y >= box.y && b.x + b.width <= box.x + box.width && b.y + b.height <= box.y + box.height
      return inside ? [] : [text.textContent]
    })
  }))
}

// Every <text> that sits on a <rect> of its diagram but runs past that box's
// edges, so a word too long for its box shows up. A text counts as on a box
// when its middle point is inside it.
export async function textOutOfBox(page: Page, selector: string) {
  await page.evaluate(() => document.fonts.ready)
  return page.locator(selector).evaluateAll(svgs => svgs.flatMap((svg) => {
    const rects = [...svg.querySelectorAll('rect')].map(rect => rect.getBBox())
    return [...svg.querySelectorAll('text')].flatMap((text) => {
      const b = text.getBBox()
      const x = b.x + b.width / 2
      const y = b.y + b.height / 2
      const on = rects.find(r => x > r.x && x < r.x + r.width && y > r.y && y < r.y + r.height)
      if (!on) return []
      const fits = b.x >= on.x && b.x + b.width <= on.x + on.width
      return fits ? [] : [text.textContent]
    })
  }))
}
