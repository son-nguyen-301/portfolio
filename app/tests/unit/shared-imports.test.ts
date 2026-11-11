// Components never import values from shared/ (D-027, #73). Nuxt keeps
// shared/ out of the Vite server bundle, and a relative import of a value from
// there is written relative to the build folder, so `pnpm generate` fails as
// soon as a built page uses the component. Type-only imports are removed
// before the build, so they are fine.
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('../..', import.meta.url))
const appDir = join(root, 'app')
const sharedDir = join(root, 'shared')

function files(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) return files(path)
    return /\.(?:vue|ts)$/.test(entry.name) ? [path] : []
  })
}

// Drops comments, so a sentence like "never import values from shared/" is
// not read as an import. Walks the code once and skips strings, so `//` inside
// '//cdn.example.com' is not a comment. A template literal counts as one
// string, `${...}` included; no import is written inside one. A quote inside
// a regex literal would confuse it; no app file has one before an import.
function withoutComments(code: string): string {
  let out = ''
  let quote = ''
  for (let i = 0; i < code.length; i++) {
    const char = code[i]!
    if (quote) {
      out += char
      if (char === '\\') out += code[++i] ?? ''
      else if (char === quote) quote = ''
    }
    else if (char === '/' && code[i + 1] === '/') {
      while (i < code.length && code[i] !== '\n') i++
      out += '\n'
    }
    else if (char === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2)
      i = end === -1 ? code.length : end + 1
    }
    else {
      if (char === '\'' || char === '"' || char === '`') quote = char
      out += char
    }
  }
  return out
}

// Every static `import ... from '...'` and `export ... from '...'`, and
// every dynamic `import('...')`, with whether it is type-only.
function imports(code: string): Array<{ from: string, typeOnly: boolean }> {
  const source = withoutComments(code)
  const found: Array<{ from: string, typeOnly: boolean }> = []
  const statement = /\b(?:import|export)\s+(type\s+)?([^'"`;]*?)\s*from\s*['"]([^'"]+)['"]/g
  for (const match of source.matchAll(statement)) {
    const names = match[2]!.trim()
    // `import { type A, type B } from` is type-only too.
    const allTypes = /^\{[^}]*\}$/.test(names) && names.slice(1, -1).split(',').map(part => part.trim()).filter(Boolean).every(part => part.startsWith('type '))
    found.push({ from: match[3]!, typeOnly: Boolean(match[1]) || allTypes })
  }
  for (const match of source.matchAll(/\bimport\s+['"]([^'"]+)['"]/g)) found.push({ from: match[1]!, typeOnly: false })
  for (const match of source.matchAll(/\bimport\(\s*['"]([^'"]+)['"]\s*\)/g)) found.push({ from: match[1]!, typeOnly: false })
  return found
}

// The code to scan: the <script> blocks of a .vue file (template text such as
// "don't" would read as an open string), or the whole of a .ts file.
function code(file: string): string {
  const text = readFileSync(file, 'utf8')
  if (!file.endsWith('.vue')) return text
  return [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map(match => match[1]).join('\n')
}

function intoShared(file: string, from: string): boolean {
  if (from === '#shared' || from.startsWith('#shared/')) return true
  if (!from.startsWith('.')) return false
  const target = resolve(dirname(file), from)
  return target === sharedDir || target.startsWith(sharedDir + '/')
}

describe('imports from shared/', () => {
  it('finds value and type imports', () => {
    const found = imports([
      `import { a } from '../../shared/x'`,
      `import type { B } from '#shared/y'`,
      `import { type C, type D } from '#shared/z'`,
      `import { type E, f } from '#shared/w'`,
      `export { g } from '../shared/v'`,
      `import '../shared/side-effect'`,
      `const h = await import('#shared/lazy')`,
      `// never import values from '#shared/comment'`,
      `/* import { i } from '#shared/block' */`,
      `const url = 'https://example.com'`,
      `const cdn = '//cdn.example.com'; import { j } from '#shared/after-string'`,
    ].join('\n'))
    expect(found).toEqual([
      { from: '../../shared/x', typeOnly: false },
      { from: '#shared/y', typeOnly: true },
      { from: '#shared/z', typeOnly: true },
      { from: '#shared/w', typeOnly: false },
      { from: '../shared/v', typeOnly: false },
      { from: '#shared/after-string', typeOnly: false },
      { from: '../shared/side-effect', typeOnly: false },
      { from: '#shared/lazy', typeOnly: false },
    ])
  })

  const appFiles = files(appDir)

  // Pages and layouts go into the same server bundle, so the rule covers
  // every .vue file in app/app, not only app/app/components.
  it.each(appFiles.filter(file => file.endsWith('.vue')).map(file => [relative(root, file), file]))(
    '%s imports no values from shared/', (_name, file) => {
      const values = imports(code(file)).filter(item => !item.typeOnly && intoShared(file, item.from))
      expect(values.map(item => item.from)).toEqual([])
    },
  )

  // Composables and utils may use #shared, which Nitro bundles, but never a
  // relative path to shared/, which fails the build.
  it.each(appFiles.filter(file => file.endsWith('.ts')).map(file => [relative(root, file), file]))(
    '%s imports no values from shared/ by a relative path', (_name, file) => {
      const values = imports(code(file)).filter(item => !item.typeOnly && item.from.startsWith('.') && intoShared(file, item.from))
      expect(values.map(item => item.from)).toEqual([])
    },
  )
})
