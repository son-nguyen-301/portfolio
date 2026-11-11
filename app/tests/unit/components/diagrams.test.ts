// @vitest-environment happy-dom
// The six diagrams (PF-014). Each one is named in content, has a <title> for
// screen readers, and draws only words that are in the content file that
// names it (CLAUDE.md hard rule 2).
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { diagrams } from '../../../app/utils/diagrams'

// happy-dom replaces the global URL, so the path is built from the folder.
const content = join(import.meta.dirname, '../../../content')
const files = ['work', 'lab'].flatMap(dir => readdirSync(join(content, dir)).map(name => join(content, dir, name)))
// The content file that names each diagram in a media `src`.
const namedIn = new Map<string, string>()
for (const file of files) {
  for (const match of readFileSync(file, 'utf8').matchAll(/^\s*src:\s*(Diagram\w+)\s*$/gm)) namedIn.set(match[1]!, file)
}

const words = (text: string) => text.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []

describe('diagrams', () => {
  it('has a component for every diagram named in content, and none more', () => {
    expect([...namedIn.keys()].sort()).toEqual(Object.keys(diagrams).sort())
    expect(namedIn.size).toBe(6)
  })

  it.each(Object.keys(diagrams))('%s is an SVG image with the title it is given', (name) => {
    const wrapper = mount(diagrams[name]!, { props: { title: 'The alt text' } })
    const svg = wrapper.find('svg')
    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('viewBox')).toMatch(/^0 0 320 \d+$/)
    expect(svg.classes()).toContain('diagram')
    expect(svg.element.firstElementChild?.tagName.toLowerCase()).toBe('title')
    expect(svg.find('title').text()).toBe('The alt text')
  })

  it.each(Object.keys(diagrams))('%s draws only words from the content that names it', (name) => {
    const source = new Set(words(readFileSync(namedIn.get(name)!, 'utf8')))
    const wrapper = mount(diagrams[name]!, { props: { title: '' } })
    const drawn = wrapper.findAll('text').flatMap(text => words(text.text()))
    expect(drawn.length).toBeGreaterThan(0)
    expect(drawn.filter(word => !source.has(word))).toEqual([])
  })

  it.each(Object.keys(diagrams))('%s draws every shape inside its 320-unit width', (name) => {
    const wrapper = mount(diagrams[name]!, { props: { title: '' } })
    const height = Number(wrapper.find('svg').attributes('viewBox')!.split(' ')[3])
    for (const rect of wrapper.findAll('rect')) {
      const [x, y, width, h] = ['x', 'y', 'width', 'height'].map(key => Number(rect.attributes(key)))
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x! + width!).toBeLessThanOrEqual(320)
      expect(y).toBeGreaterThanOrEqual(0)
      expect(y! + h!).toBeLessThanOrEqual(height)
    }
  })
})
