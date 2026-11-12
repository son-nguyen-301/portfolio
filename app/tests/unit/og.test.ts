// Link preview images (PF-021, D-037): the size, the colors the template copies
// from tokens.css, the weights, the heading sizes, the alt text and
// the arguments usePageOgImage() passes on.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { ogColors, ogColorTokens, ogImageAlt, ogImageArgs, ogImageSize, ogTitleSize, ogWeight } from '../../app/utils/og'

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

describe('ogImageAlt', () => {
  it('says what the image shows', () => {
    expect(ogImageAlt({ label: 'Case study', title: 'A sample', metric: 'Sample result' }, 'Sample Name')).toBe('Case study: A sample · Sample result · Sample Name')
    expect(ogImageAlt({ label: 'Lab', title: 'Side projects' }, 'Sample Name')).toBe('Lab: Side projects · Sample Name')
  })
})

describe('ogImageArgs', () => {
  // The whole profile, as useSiteProfile() gives it: only the name and the job
  // title may reach the image.
  const profile = {
    name: 'Sample Name',
    title: 'Sample Title',
    location: 'Sample City',
    hours: 'sample hours',
    replyPromise: 'I reply soon.',
    links: { linkedin: 'https://example.com/in', github: 'https://example.com/gh', upwork: 'https://example.com/up' },
  }

  it('adds only the name, the job title and the host to the card', () => {
    expect(ogImageArgs({ label: 'Case study', title: 'A sample', metric: 'Sample result' }, profile, 'https://sample.example.com')).toEqual({
      props: { label: 'Case study', title: 'A sample', metric: 'Sample result', name: 'Sample Name', jobTitle: 'Sample Title', host: 'sample.example.com' },
      alt: 'Case study: A sample · Sample result · Sample Name',
    })
  })

  it('stops the build when the label or the heading is missing', () => {
    expect(() => ogImageArgs({ label: 'About', title: undefined }, profile, 'https://sample.example.com')).toThrow(/needs a label and a heading/)
    expect(() => ogImageArgs({ label: '', title: 'Side projects' }, profile, 'https://sample.example.com')).toThrow(/needs a label and a heading/)
  })
})
