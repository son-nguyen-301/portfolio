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

// Every CSS color name. `transparent`, `currentColor` and `inherit` are
// allowed: they carry no color of their own.
const namedColors = (
  'aliceblue antiquewhite aqua aquamarine azure beige bisque black blanchedalmond blue blueviolet brown burlywood '
  + 'cadetblue chartreuse chocolate coral cornflowerblue cornsilk crimson cyan darkblue darkcyan darkgoldenrod darkgray '
  + 'darkgreen darkgrey darkkhaki darkmagenta darkolivegreen darkorange darkorchid darkred darksalmon darkseagreen '
  + 'darkslateblue darkslategray darkslategrey darkturquoise darkviolet deeppink deepskyblue dimgray dimgrey dodgerblue '
  + 'firebrick floralwhite forestgreen fuchsia gainsboro ghostwhite gold goldenrod gray green greenyellow grey honeydew '
  + 'hotpink indianred indigo ivory khaki lavender lavenderblush lawngreen lemonchiffon lightblue lightcoral lightcyan '
  + 'lightgoldenrodyellow lightgray lightgreen lightgrey lightpink lightsalmon lightseagreen lightskyblue lightslategray '
  + 'lightslategrey lightsteelblue lightyellow lime limegreen linen magenta maroon mediumaquamarine mediumblue '
  + 'mediumorchid mediumpurple mediumseagreen mediumslateblue mediumspringgreen mediumturquoise mediumvioletred '
  + 'midnightblue mintcream mistyrose moccasin navajowhite navy oldlace olive olivedrab orange orangered orchid '
  + 'palegoldenrod palegreen paleturquoise palevioletred papayawhip peachpuff peru pink plum powderblue purple '
  + 'rebeccapurple red rosybrown royalblue saddlebrown salmon sandybrown seagreen seashell sienna silver skyblue '
  + 'slateblue slategray slategrey snow springgreen steelblue tan teal thistle tomato turquoise violet wheat white '
  + 'whitesmoke yellow yellowgreen'
).split(' ')
const colorPattern = new RegExp(
  [
    '#[0-9a-f]{3,8}\\b',
    '\\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\\(',
    `(?<![\\w-])(?:${namedColors.join('|')})(?![\\w-])`,
  ].join('|'),
  'i',
)

// SVG and HTML attributes that take a color, plain or bound (`:fill`).
const colorAttributes = /(?:^|\s):?(?:fill|stroke|stop-color|flood-color|lighting-color|color|bgcolor)="([^"]*)"/g

// The colors set in a file: <style> blocks, inline style attributes and
// color attributes such as an SVG `fill`.
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
  const template = source.replace(/<style[^>]*>[\s\S]*?<\/style>/g, '').replace(/<script[^>]*>[\s\S]*?<\/script>/g, '')
  for (const match of template.matchAll(colorAttributes)) {
    const value = match[1]!.trim()
    if (colorPattern.test(value)) found.push(value)
  }
  return found
}

describe('component colors', () => {
  it('finds hard-coded colors', () => {
    expect(hardCodedColors('<style>.a { color: #fff; }</style>')).toEqual(['#fff'])
    expect(hardCodedColors('<style>.a { border: 1px solid rgb(0 0 0); }</style>')).toHaveLength(1)
    expect(hardCodedColors('<style>.a { background: white; }</style>')).toEqual(['white'])
    expect(hardCodedColors('<template><p style="color: red">x</p></template>')).toEqual(['red'])
    expect(hardCodedColors('<style>.a { color: crimson; }</style>')).toEqual(['crimson'])
    expect(hardCodedColors('<template><path fill="#0D7663" stroke="black" /></template>')).toEqual(['#0D7663', 'black'])
    expect(hardCodedColors('<template><stop :stop-color="\'red\'" /></template>')).toEqual(['\'red\''])
    expect(hardCodedColors('<style>.a { color: var(--ink); white-space: nowrap; background: transparent; }</style>')).toEqual([])
    expect(hardCodedColors('<template><path fill="var(--jade)" stroke="currentColor" /></template>')).toEqual([])
  })

  const files = vueFiles(appDir)

  it('has .vue files to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map(file => [relative(appDir, file), file]))('%s uses only color tokens', (_name, file) => {
    expect(hardCodedColors(readFileSync(file, 'utf8'))).toEqual([])
  })
})
