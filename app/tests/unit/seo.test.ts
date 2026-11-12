import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { labDescription, maxDescription, metaDescription } from '../../app/utils/seo'

const profile = parse(readFileSync(fileURLToPath(new URL('../../content/profile.yml', import.meta.url)), 'utf8')) as { hero: { headline: string, subline: string } }

describe('metaDescription', () => {
  it('joins the parts when they fit', () => {
    expect(metaDescription('One line.', 'Two lines.')).toBe('One line. Two lines.')
  })

  it('drops whole sentences from the end until it fits', () => {
    const long = 'x'.repeat(100)
    expect(metaDescription(`Short one. ${long}.`, `${long}.`)).toBe(`Short one. ${long}.`)
  })

  it('keeps a first sentence that is too long whole', () => {
    const first = `${'word '.repeat(40).trim()}.`
    expect(metaDescription(first, 'Next.')).toBe(first)
  })

  it('skips empty and missing parts', () => {
    expect(metaDescription(undefined, '  ', 'Only this.')).toBe('Only this.')
    expect(metaDescription()).toBe('')
  })

  it('keeps the home description within what search results show', () => {
    const description = metaDescription(profile.hero.headline, profile.hero.subline)
    expect(description.startsWith(profile.hero.headline)).toBe(true)
    expect(description.length).toBeLessThanOrEqual(maxDescription)
  })
})

describe('labDescription', () => {
  it('lists the project names after the heading', () => {
    expect(labDescription(['A', 'B', 'C'])).toBe('Side projects: A, B and C.')
    expect(labDescription(['A', 'B'])).toBe('Side projects: A and B.')
    expect(labDescription(['A'])).toBe('Side projects: A.')
    expect(labDescription([])).toBe('Side projects.')
  })
})
