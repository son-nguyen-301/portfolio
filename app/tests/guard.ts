// The banned-words guard (CLAUDE.md hard rules 1 and 3).
// The repo is public, so the words to block are stored only as SHA-256 hashes
// (head/DECISIONS.md D-004). Reports name the file, the line and the hash,
// never the plain word, so CI logs don't leak it either.
import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join } from 'node:path'

export interface Hit {
  file: string
  line: number
  kind: 'banned-word' | 'vn-phone'
  detail: string
}

// A plain word: letters and digits only.
const WORD = /[\p{L}\p{N}]+/gu
// A dotted or joined word kept whole, like a domain or an email address.
const JOINED = /[\p{L}\p{N}]+(?:[.\-_@][\p{L}\p{N}]+)+/gu
// A Vietnamese phone number: +84 and then 8 to 10 digits, with optional
// spaces, dots, dashes or brackets between them. The lookbehind skips
// sums in minified code, like `a+84000000`.
const VN_PHONE = /(?<![\p{L}\p{N}_)\]])\+84(?:[\s.\-()]*\d){8,10}/gu

// Files we can't read as text. Everything else is scanned.
const BINARY = new Set([
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.avif',
  '.woff', '.woff2', '.ttf', '.otf', '.eot',
  '.mp4', '.webm', '.mp3', '.zip', '.gz', '.br', '.wasm',
])

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

/**
 * Every word in a line, lowercased: plain words, then dotted words whole.
 * A dotted word also gives each of its endings, so `www.example.co.nz` and
 * `me@example.co.nz` both give `example.co.nz`.
 */
export function words(text: string): string[] {
  const lower = text.normalize('NFC').toLowerCase()
  const joined = new Set<string>()
  for (const word of lower.match(JOINED) ?? []) {
    joined.add(word)
    for (const part of word.split('@')) {
      const labels = part.split('.')
      for (let i = 0; i < labels.length - 1; i++) joined.add(labels.slice(i).join('.'))
    }
  }
  return [...(lower.match(WORD) ?? []), ...joined]
}

export function scanText(text: string, banned: ReadonlySet<string>, file = '<text>'): Hit[] {
  const hits: Hit[] = []
  text.split(/\r?\n/).forEach((content, index) => {
    const line = index + 1
    for (const word of words(content)) {
      const hash = sha256(word)
      if (banned.has(hash)) hits.push({ file, line, kind: 'banned-word', detail: hash })
    }
    for (const match of content.matchAll(VN_PHONE)) {
      hits.push({ file, line, kind: 'vn-phone', detail: `${match[0].slice(0, 3)}…` })
    }
  })
  return hits
}

/** Every text file under the given folders. Folders that don't exist are skipped. */
export function textFiles(dirs: string[]): string[] {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (statSync(path).isDirectory()) walk(path)
      else if (!BINARY.has(extname(name).toLowerCase())) files.push(path)
    }
  }
  for (const dir of dirs) if (existsSync(dir)) walk(dir)
  return files
}

export function scanFiles(files: string[], banned: ReadonlySet<string>): Hit[] {
  return files.flatMap(file => scanText(readFileSync(file, 'utf8'), banned, file))
}

export function formatHits(hits: Hit[], root: string): string {
  return hits
    .map(hit => `${hit.file.replace(`${root}/`, '')}:${hit.line} ${hit.kind} ${hit.detail}`)
    .join('\n')
}
