// WCAG contrast for the main color token pairs, read from tokens.css, in both
// themes (docs/design.md: "WCAG AA contrast in both themes").
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const css = readFileSync(fileURLToPath(new URL('../../app/assets/css/tokens.css', import.meta.url)), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

// The color tokens set inside the first block whose selector matches.
function colorsIn(selector: RegExp): Record<string, string> {
  const start = css.search(selector)
  if (start < 0) throw new Error(`no block for ${selector}`)
  const open = css.indexOf('{', start)
  const close = css.indexOf('}', open)
  const body = css.slice(open + 1, close)
  return Object.fromEntries([...body.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map(m => [m[1], m[2]!.toLowerCase()]))
}

const light = colorsIn(/^:root\s*\{/m)
const darkSystem = colorsIn(/:root:not\(\[data-theme="light"\]\)\s*\{/)
const darkForced = colorsIn(/:root\[data-theme="dark"\]\s*\{/)
// The print block: light colors in any theme (PF-018).
const print = colorsIn(/@media print\s*\{[^{]*:root\[data-theme\]\s*\{/)

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = Number.parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  }) as [number, number, number]
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
  return (hi + 0.05) / (lo + 0.05)
}

// Text pairs need 4.5:1 (WCAG 1.4.3, normal text).
const textPairs: Array<[string, string]> = [
  ['ink', 'paper'],
  ['ink', 'surface'],
  ['muted', 'paper'],
  ['muted', 'surface'],
  ['jade', 'paper'],
  ['jade', 'surface'],
  ['jade', 'jade-soft'],
  ['ink', 'jade-soft'],
  ['ink', 'amber-soft'],
  ['on-jade', 'jade'],
  ['paper', 'ink'],
]

// Non-text pairs need 3:1 (WCAG 1.4.11): the jade focus ring and amber marks.
// Light amber is below 4.5:1 on paper, so amber is never used for text.
const markPairs: Array<[string, string]> = [
  ['jade', 'paper'],
  ['jade', 'surface'],
  ['amber', 'paper'],
  ['amber', 'surface'],
]

describe('color tokens', () => {
  it('has the colors from docs/design.md', () => {
    expect(light).toMatchObject({
      'paper': '#f5f7f8', 'surface': '#ffffff', 'ink': '#141a22', 'muted': '#5a6472', 'line': '#dce1e6',
      'jade': '#0d7663', 'jade-soft': '#dcefea', 'amber': '#a86a12', 'amber-soft': '#f6ebd9',
    })
    expect(darkForced).toMatchObject({
      'paper': '#0e1216', 'surface': '#151b21', 'ink': '#e6ebf0', 'muted': '#9aa5b1', 'line': '#27303a',
      'jade': '#43c2a8', 'jade-soft': '#15302a', 'amber': '#e2a64c', 'amber-soft': '#33270f',
    })
  })

  it('sets the same dark colors for the system setting and the switch', () => {
    expect(darkSystem).toEqual(darkForced)
  })

  it('prints with the light colors in any theme', () => {
    expect(print).toEqual(light)
  })

  it('redefines every light color in dark mode', () => {
    expect(Object.keys(darkForced).sort()).toEqual(Object.keys(light).sort())
  })

  it('checks contrast correctly', () => {
    expect(contrast('#000000', '#ffffff')).toBeCloseTo(21, 5)
    expect(contrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5)
    expect(contrast('#777777', '#ffffff')).toBeCloseTo(4.48, 2)
  })

  for (const [name, theme] of [['light', light], ['dark', darkForced]] as const) {
    describe(`${name} theme`, () => {
      it.each(textPairs)('--%s on --%s passes AA for text (4.5:1)', (fg, bg) => {
        expect(theme[fg], fg).toBeDefined()
        expect(theme[bg], bg).toBeDefined()
        expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(4.5)
      })

      it.each(markPairs)('--%s on --%s passes AA for marks (3:1)', (fg, bg) => {
        expect(contrast(theme[fg]!, theme[bg]!)).toBeGreaterThanOrEqual(3)
      })
    })
  }
})
