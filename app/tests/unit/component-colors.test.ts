// "No component has a hard-coded color" (PF-005). Every color in a .vue file
// must come from a token in app/assets/css/tokens.css, as var(--name).
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const appDir = fileURLToPath(new URL('../../app', import.meta.url))

function vueFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return vueFiles(path)
    return entry.name.endsWith('.vue') ? [path] : []
  })
}

// Color keywords a person might type. `transparent`, `currentColor` and
// `inherit` are allowed: they carry no color of their own.
const namedColors = ['white', 'black', 'red', 'green', 'blue', 'gray', 'grey', 'silver', 'yellow', 'orange', 'purple', 'pink', 'teal', 'navy', 'maroon', 'olive', 'lime', 'aqua', 'fuchsia', 'brown', 'gold']
const colorPattern = new RegExp(
  [
    '#[0-9a-f]{3,8}\\b',
    '\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(',
    `(?<![\\w-])(?:${namedColors.join('|')})(?![\\w-])`,
  ].join('|'),
  'i',
)

// The colors set in a file: <style> blocks and inline style attributes.
function hardCodedColors(source: string): string[] {
  const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]!)
  const inline = [...source.matchAll(/\bstyle="([^"]*)"/g)].map(match => match[1]!)
  const found: string[] = []
  for (const css of [...styles, ...inline]) {
    const clean = css.replace(/\/\*[\s\S]*?\*\//g, '')
    // Only declaration values, so selectors such as `.fill--jade` don't count.
    for (const match of clean.matchAll(/[\w-]+\s*:\s*([^;{}]+)/g)) {
      const value = match[1]!.trim()
      if (colorPattern.test(value)) found.push(value)
    }
  }
  return found
}

describe('component colors', () => {
  it('finds hard-coded colors', () => {
    expect(hardCodedColors('<style>.a { color: #fff; }</style>')).toEqual(['#fff'])
    expect(hardCodedColors('<style>.a { border: 1px solid rgb(0 0 0); }</style>')).toHaveLength(1)
    expect(hardCodedColors('<style>.a { background: white; }</style>')).toEqual(['white'])
    expect(hardCodedColors('<template><p style="color: red">x</p></template>')).toEqual(['red'])
    expect(hardCodedColors('<style>.a { color: var(--ink); white-space: nowrap; background: transparent; }</style>')).toEqual([])
  })

  const files = vueFiles(appDir)

  it('has .vue files to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map(file => [relative(appDir, file), file]))('%s uses only color tokens', (_name, file) => {
    expect(hardCodedColors(readFileSync(file, 'utf8'))).toEqual([])
  })
})
