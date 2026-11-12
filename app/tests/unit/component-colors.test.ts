// "No component has a hard-coded color" (PF-005, PF-038). Every color in a
// .vue file, and in the code under app/app, must come from a token in
// app/assets/css/tokens.css, as var(--name).
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
import { describe, expect, it } from 'vitest'
import { ogColors } from '../../app/utils/og'

const appDir = fileURLToPath(new URL('../../app', import.meta.url))

function sourceFiles(dir: string, pattern: RegExp): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return sourceFiles(path, pattern)
    return pattern.test(entry.name) ? [path] : []
  })
}

// Code files that may hold colors: the only colors each one may hold, and
// why. Any other color in the file fails, and so does a file that is gone.
const allowedCodeFiles: Record<string, { colors: string[], reason: string }> = {
  // The link preview renderer can't read tokens.css (D-037).
  // tests/unit/og.test.ts keeps each value equal to its light token.
  'utils/og.ts': { colors: Object.values(ogColors), reason: 'ogColors copies the light tokens for the preview images' },
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

// An attribute value: in double or single quotes, or unquoted (`fill=red`).
const attributeValue = '=(?:(["\'])(.*?)\\1|([^\\s"\'=<>`/]+))'
// SVG and HTML attributes that take a color, also bound as `:fill` or
// `v-bind:fill`.
const colorAttributes = new RegExp(`(?:^|\\s)(?::|v-bind:)?(?:fill|stroke|stop-color|flood-color|lighting-color|color|bgcolor)${attributeValue}`, 'gs')
const styleAttributes = new RegExp(`\\bstyle${attributeValue}`, 'gs')

// The text of every string in a piece of JavaScript or TypeScript: quoted
// strings and the fixed parts of template literals. Comments don't count, nor
// do module paths (`import`, `export ... from`, `import()`, `require()`) or
// types such as `type T = 'red'`.
function stringLiterals(code: string): string[] {
  const file = ts.createSourceFile('code.ts', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)
  const found: string[] = []
  const isModulePath = (node: ts.Node) => node.parent !== undefined && ts.isCallExpression(node.parent)
    && node.parent.arguments[0] === node
    && (node.parent.expression.kind === ts.SyntaxKind.ImportKeyword
      || (ts.isIdentifier(node.parent.expression) && node.parent.expression.text === 'require'))
  const visit = (node: ts.Node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node) || ts.isTypeNode(node) || ts.isImportEqualsDeclaration(node)) return
    if (isModulePath(node)) return
    if (ts.isStringLiteralLike(node) || ts.isTemplateLiteralToken(node)) found.push(node.text)
    ts.forEachChild(node, visit)
  }
  visit(file)
  return found
}

// The colors written in strings in a piece of code.
function codeColors(code: string): string[] {
  return stringLiterals(code).filter(text => colorPattern.test(text))
}

// The colors set in a .vue file: <style> blocks, inline style attributes,
// color attributes such as an SVG `fill`, and strings in <script> blocks, such
// as `const c = '#0D7663'` used as `:fill="c"`.
function hardCodedColors(source: string): string[] {
  const styles = [...source.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(match => match[1]!)
  const inline = [...source.matchAll(styleAttributes)].map(match => match[2] ?? match[3]!)
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
    const value = (match[2] ?? match[3]!).trim()
    if (colorPattern.test(value)) found.push(value)
  }
  for (const script of source.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)) {
    found.push(...codeColors(script[1]!))
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
    expect(hardCodedColors(`<template><path fill='red' /></template>`)).toEqual(['red'])
    expect(hardCodedColors(`<template><p style='color: red'>x</p></template>`)).toEqual(['red'])
    expect(hardCodedColors(`<template><path v-bind:fill="'red'" /></template>`)).toEqual(['\'red\''])
  })

  it('finds unquoted color attributes', () => {
    expect(hardCodedColors('<template><path fill=red /></template>')).toEqual(['red'])
    expect(hardCodedColors('<template><path stroke=#0D7663/></template>')).toEqual(['#0D7663'])
    expect(hardCodedColors('<template><p style=color:red>x</p></template>')).toEqual(['red'])
    expect(hardCodedColors('<template><path fill=currentColor /></template>')).toEqual([])
  })

  it('finds colors in <script> blocks', () => {
    const vue = (script: string) => `<script setup lang="ts">${script}</script><template><path :fill="c" /></template>`
    expect(hardCodedColors(vue(`const c = '#0D7663'`))).toEqual(['#0D7663'])
    expect(hardCodedColors(vue(`const c = "white"`))).toEqual(['white'])
    expect(hardCodedColors(vue('const c = `rgb(0 0 0 / ${alpha})`'))).toEqual(['rgb(0 0 0 / '])
    expect(hardCodedColors(vue(`const style = { color: 'red' }`))).toEqual(['red'])
    expect(hardCodedColors(`<script>export default { data: () => ({ c: 'black' }) }</script>`)).toEqual(['black'])
    // Comments, import paths and words that only contain a color name don't count.
    expect(hardCodedColors(vue(`// was '#0D7663'\n/* red */\nimport x from './red'\nconst c = 'var(--jade)'\nconst w = 'white-space'`))).toEqual([])
  })

  it('finds colors in code files', () => {
    expect(codeColors(`export const jade = '#0D7663'`)).toEqual(['#0D7663'])
    expect(codeColors(`export function tone() { return 'hsl(170 80% 26%)' }`)).toEqual(['hsl(170 80% 26%)'])
    expect(codeColors(`export const tones = { ok: 'green', late: \`orange\` }`)).toEqual(['green', 'orange'])
    expect(codeColors(`export { a } from './white'\n// #fff\nexport const t = 'var(--ink)'`)).toEqual([])
    expect(codeColors(`const a = import('./red')\nconst b = require('./white')\ntype T = 'red' | 'blue'\nlet c: { tone: 'green' }`)).toEqual([])
    expect(codeColors(`const a = load('./red')`)).toEqual(['./red'])
  })

  const files = sourceFiles(appDir, /\.vue$/)

  it('has .vue files to check', () => {
    expect(files.length).toBeGreaterThan(0)
  })

  it.each(files.map(file => [relative(appDir, file), file]))('%s uses only color tokens', (_name, file) => {
    expect(hardCodedColors(readFileSync(file, 'utf8'))).toEqual([])
  })

  const codeFiles = sourceFiles(appDir, /\.[cm]?[jt]s$/)

  it('has code files to check', () => {
    expect(codeFiles.length).toBeGreaterThan(0)
  })

  it.each(codeFiles.map(file => [relative(appDir, file), file]))('%s uses only color tokens', (name, file) => {
    const colors = codeColors(readFileSync(file, 'utf8'))
    const allowed = allowedCodeFiles[name]
    if (allowed) expect(colors.sort(), allowed.reason).toEqual([...allowed.colors].sort())
    else expect(colors).toEqual([])
  })

  it('allows only code files that exist', () => {
    const names = codeFiles.map(file => relative(appDir, file))
    for (const name of Object.keys(allowedCodeFiles)) expect(names).toContain(name)
  })
})
