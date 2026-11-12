// Link preview images (PF-021, D-037): the size, the colors the template copies
// from tokens.css, the weights and the heading sizes.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ogColors, ogColorTokens, ogImageSize, ogTitleSize, ogWeight } from '../../app/utils/og'

const css = readFileSync(fileURLToPath(new URL('../../app/assets/css/tokens.css', import.meta.url)), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')

// The light theme: the color tokens of the first `:root {` block.
function lightTokens(): Record<string, string> {
  const start = css.search(/^:root\s*\{/m)
  const body = css.slice(css.indexOf('{', start) + 1, css.indexOf('}', start))
  return Object.fromEntries([...body.matchAll(/(--[\w-]+):\s*(#[0-9a-fA-F]{6})\s*;/g)].map(m => [m[1], m[2]!.toLowerCase()]))
}

describe('ogImageSize', () => {
  it('is the 1200 x 630 that LinkedIn and Upwork expect', () => {
    expect(ogImageSize).toEqual({ width: 1200, height: 630 })
  })
})

describe('ogColors', () => {
  it('copies the light theme tokens of tokens.css', () => {
    const tokens = lightTokens()
    expect(Object.keys(ogColors).sort()).toEqual(Object.keys(ogColorTokens).sort())
    for (const [name, value] of Object.entries(ogColors)) {
      const token = ogColorTokens[name as keyof typeof ogColors]
      expect(tokens[token], `${name} (${token})`).toBe(value.toLowerCase())
    }
  })
})

describe('ogWeight', () => {
  it('sets the weight and the wght axis of a variable font', () => {
    expect(ogWeight(700)).toEqual({ fontWeight: 700, fontVariationSettings: `'wght' 700` })
    expect(ogWeight(400)).toEqual({ fontWeight: 400, fontVariationSettings: `'wght' 400` })
  })
})

describe('ogTitleSize', () => {
  it('makes a long heading smaller', () => {
    expect(ogTitleSize('Side projects')).toBe(76)
    expect(ogTitleSize('x'.repeat(40))).toBe(76)
    expect(ogTitleSize('x'.repeat(41))).toBe(64)
    expect(ogTitleSize('x'.repeat(70))).toBe(64)
    expect(ogTitleSize('x'.repeat(71))).toBe(54)
  })
})
