// The banned-words guard (CLAUDE.md hard rules 1 and 3).
// The repo is public, so the words to block are stored only as SHA-256 hashes
// (head/DECISIONS.md D-004). Reports name the file, the line and the hash,
// never the plain word, so CI logs don't leak it either.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { gunzipSync } from 'node:zlib'

export interface Hit {
  file: string
  line: number
  kind: 'banned-word' | 'vn-phone'
  detail: string
}

// A plain word: letters and digits only.
const WORD = /[\p{L}\p{N}]+/gu
// A joined word kept whole, like `name-with.dots` or an email address.
const JOINED = /[\p{L}\p{N}]+(?:[.\-_@][\p{L}\p{N}]+)+/gu
// A dotted word, like a domain. Each of its endings is checked too.
const DOTTED = /[\p{L}\p{N}]+(?:\.[\p{L}\p{N}]+)+/gu
// Where a camelCase name or a word glued to digits splits into pieces.
// `ACMEWidget` splits into `ACME` and `Widget`.
const PIECE_BREAK = /(?<=\p{Ll})(?=\p{Lu})|(?<=\p{Lu})(?=\p{Lu}\p{Ll})|(?<=\p{L})(?=\p{N})|(?<=\p{N})(?=\p{L})/u
// A Vietnamese phone number: +84 or 0084, then 8 to 10 digits, with optional
// spaces, dots, dashes, slashes, underscores or brackets between them. The lookbehind skips sums in
// minified code, like `a+84000000`. Runs after entities and %-codes are decoded,
// so `&#43;84` and `%2B84` are caught too.
const VN_PHONE = /(?<![\p{L}\p{N}_)\]])(?:\+|00)\s?84(?:[\s.\-()/_]*\d){8,10}/gu
// A WhatsApp link to a Vietnamese number: `wa.me/84…` or `phone=84…`.
const VN_WHATSAPP = /(?:wa\.me\/|phone=)84\d{8,10}/gu
// Invisible characters, like a zero-width space, a soft hyphen or a Hangul filler.
const INVISIBLE = /[\p{Cf}\u034F\uFE00-\uFE0F\u115F\u1160\u3164\uFFA0\u2800]/gu

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', shy: '\u00AD', plus: '+', period: '.', commat: '@',
}

// Files we can't read as text. Everything else is scanned.
const BINARY = new Set([
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp4', '.webm', '.mp3', '.zip', '.gz', '.br', '.wasm',
])

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

function codePoint(value: number, fallback: string): string {
  return value >= 0 && value <= 0x10FFFF ? String.fromCodePoint(value) : fallback
}

/**
 * Turns lookalike text into what a reader sees: decodes HTML entities and
 * %-codes, folds fullwidth and other compatibility letters (NFKC), and drops
 * invisible characters.
 */
export function normalize(text: string): string {
  return text
    .replace(/&#x([0-9a-f]+);?/gi, (m, hex: string) => codePoint(Number.parseInt(hex, 16), m))
    .replace(/&#(\d+);?/g, (m, dec: string) => codePoint(Number.parseInt(dec, 10), m))
    .replace(/&([a-z]+);/gi, (m, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? m)
    .replace(/(?:%[0-9a-f]{2})+/gi, (m) => {
      try {
        return decodeURIComponent(m)
      }
      catch {
        return m
      }
    })
    .normalize('NFKC')
    .replace(INVISIBLE, '')
}

/**
 * Every word in a line, lowercased: plain words, the pieces of camelCase names
 * and of words glued to digits, joined words whole, and each ending of a dotted
 * word, so `www.example.co.nz` and `me@example.co.nz` both give `example.co.nz`.
 */
export function words(text: string): string[] {
  const clean = normalize(text)
  const lower = clean.toLowerCase()
  const found = new Set<string>()
  for (const word of clean.match(WORD) ?? []) {
    found.add(word.toLowerCase())
    // Every run of up to 4 pieces, so `myExampleCorpLogo` gives `examplecorp`.
    const pieces = word.split(PIECE_BREAK)
    for (let i = 0; i < pieces.length; i++) {
      for (let j = i + 1; j <= Math.min(i + 4, pieces.length); j++) found.add(pieces.slice(i, j).join('').toLowerCase())
    }
  }
  for (const word of lower.match(JOINED) ?? []) found.add(word)
  // Each word without accents too, so `éxample` (e plus a combining accent) is caught.
  for (const word of [...found]) found.add(word.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC'))
  for (const word of lower.match(DOTTED) ?? []) {
    const labels = word.split('.')
    for (let i = 0; i < labels.length - 1; i++) found.add(labels.slice(i).join('.'))
  }
  return [...found]
}

export function scanText(text: string, banned: ReadonlySet<string>, file = '<text>', firstLine = 1): Hit[] {
  const hits: Hit[] = []
  text.split(/\r?\n/).forEach((content, index) => {
    const line = firstLine + index
    for (const word of words(content)) {
      const hash = sha256(word)
      if (banned.has(hash)) hits.push({ file, line, kind: 'banned-word', detail: hash })
    }
    const clean = normalize(content)
    for (const match of [...clean.matchAll(VN_PHONE), ...clean.matchAll(VN_WHATSAPP)]) {
      hits.push({ file, line, kind: 'vn-phone', detail: `${match[0].slice(0, 3)}…` })
    }
  })
  return hits
}

/** Every file under the given folders, binary or not. Folders that don't exist are skipped. */
export function allFiles(dirs: string[]): string[] {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else files.push(path)
    }
  }
  for (const dir of dirs) if (existsSync(dir)) walk(dir)
  return files
}

export function isText(path: string): boolean {
  return !BINARY.has(extname(path).toLowerCase())
}

/**
 * Reads a file as text. A file that holds only base64 of gzip data, like the
 * Nuxt Content database dump in `.output/public/__nuxt_content`, is unpacked.
 */
export function readText(file: string): string {
  const text = readFileSync(file, 'utf8')
  const trimmed = text.trim()
  if (trimmed.startsWith('H4sI') && /^[A-Za-z0-9+/=\s]+$/.test(trimmed)) {
    try {
      return gunzipSync(Buffer.from(trimmed, 'base64')).toString('utf8')
    }
    catch {
      return text
    }
  }
  return text
}

/**
 * Scans the path of every file below `root` (reported as line 0), so a logo
 * named after a banned word fails, and the contents of every text file.
 */
export function scanFiles(files: string[], banned: ReadonlySet<string>, root = '/'): Hit[] {
  return files.flatMap(file => [
    ...scanText(relative(root, file), banned, file, 0),
    ...(isText(file) ? scanText(readText(file), banned, file) : []),
  ])
}

/**
 * One line per hit. In the path, any folder or file name that holds a banned
 * word is shown as `<hidden>`, so the report never prints the word.
 */
export function formatHits(hits: Hit[], root: string, banned: ReadonlySet<string>): string {
  const hide = (path: string) => path
    .split('/')
    .map(part => (scanText(part, banned).length > 0 ? '<hidden>' : part))
    .join('/')
  return hits
    .map(hit => `${hide(relative(root, hit.file))}:${hit.line} ${hit.kind} ${hit.detail}`)
    .join('\n')
}
