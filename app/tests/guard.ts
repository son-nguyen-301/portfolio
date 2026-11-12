// The banned-words guard (CLAUDE.md hard rules 1 and 3).
// The repo is public, so the words to block are stored only as SHA-256 hashes
// (head/DECISIONS.md D-004). Reports name the file, the line and the hash,
// never the plain word, so CI logs don't leak it either.
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { extname, join, relative } from 'node:path'
import { gunzipSync } from 'node:zlib'

export interface Hit {
  file: string
  line: number
  kind: 'banned-word' | 'vn-phone'
  detail: string
}

// A plain word: letters, digits and the marks on them (a strikethrough mark
// doesn't split a word).
const WORD = /[\p{L}\p{M}\p{N}]+/gu
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
// A word of 3 or more letters may come right before `+84` (`call+84…`), but not
// a digit or a name of 1 or 2 letters, which is what minified code uses. Before
// `0084` no letter or digit may come, so a hash like `beef0084…` passes.
const VN_PHONE = /(?:(?<![\p{N}_$)\]])(?<!(?:^|[^\p{L}\p{N}_$])[\p{L}$]{1,2})\+|(?<![\p{L}\p{N}_$)\]])00)\s?84(?:[\s.\-\u2010-\u2015()/_]*\d){8,10}/gu
// A WhatsApp link to a Vietnamese number: `wa.me/84…` or `phone=84…`, with or
// without separators between the digits.
const VN_WHATSAPP = /(?:wa\.me\/|phone=)\+?84(?:[\s.\-\u2010-\u2015()/_]*\d){8,10}/gu
// Invisible characters, like a zero-width space, a soft hyphen, a variation
// selector or a Hangul filler, plus the blank Braille pattern.
const INVISIBLE = /[\p{Default_Ignorable_Code_Point}\u2800]/gu
// An HTML or XML tag, like `<b>`, `</span>` or `<wbr/>`, or an HTML comment.
// A quoted attribute may hold `>`. Removed in a second pass, so `<b>Exa</b>mple`
// reads as `Example`.
const TAG = /<!--[\s\S]*?-->|<\/?[a-z][\w:-]*(?:\s(?:[^<>"']|"[^"]*"|'[^']*')*)?\/?>/gi
// A JS escape (`\u0045`, `\u{45}`, `\x45`) or a CSS escape (`\45 `).
const ESCAPE = /\\u\{([0-9a-f]{1,6})\}|\\u([0-9a-f]{4})|\\x([0-9a-f]{2})|\\([0-9a-f]{1,6}) ?/gi
// How many words in a row are joined and checked as one, so `Example Corp`,
// `EXAMPLE_CORP` and `**Exa**mple` all give `examplecorp`. Always up to 4
// words. More, up to 16, while the joined word is at most 32 letters long, so
// `E x a m p l e C o r p` is caught too.
const MAX_JOINED = 4
const MAX_JOINED_PIECES = 16
const MAX_JOINED_LENGTH = 32
// Anything but a letter, a digit, a space or a soft mark (`-`, `_`, `.`, `*`,
// `~`, a backtick, a backslash) ends a stretch of words that may be joined.
const HARD_BREAK = /[^\p{L}\p{M}\p{N}\s\-_.*~`\\]+/u

// Cyrillic, Greek and Armenian letters that look like Latin ones. NFKC does
// not fold them, so `Ехаmple` written with Cyrillic letters is folded here.
const CONFUSABLE: Record<string, string> = {
  а: 'a', с: 'c', ԁ: 'd', е: 'e', һ: 'h', і: 'i', ј: 'j', к: 'k', ӏ: 'l', о: 'o', р: 'p', ԛ: 'q', ѕ: 's', у: 'y', ү: 'y', х: 'x', ԝ: 'w',
  А: 'A', В: 'B', С: 'C', Е: 'E', Н: 'H', І: 'I', Ј: 'J', К: 'K', М: 'M', О: 'O', Р: 'P', Ԛ: 'Q', Ѕ: 'S', Т: 'T', Х: 'X', У: 'Y', Ԝ: 'W', Ӏ: 'I', Ү: 'Y',
  α: 'a', ϲ: 'c', ε: 'e', ι: 'i', ϳ: 'j', κ: 'k', ν: 'v', ο: 'o', ρ: 'p', υ: 'u', χ: 'x',
  օ: 'o', ս: 'u', հ: 'h', ո: 'n', ց: 'g', զ: 'q', Օ: 'O', Ս: 'U',
  Α: 'A', Β: 'B', Ϲ: 'C', Ε: 'E', Η: 'H', Ι: 'I', Κ: 'K', Μ: 'M', Ν: 'N', Ο: 'O', Ρ: 'P', Τ: 'T', Υ: 'Y', Χ: 'X', Ζ: 'Z',
}
const CONFUSABLES = new RegExp(`[${Object.keys(CONFUSABLE).join('')}]`, 'gu')

const NAMED_ENTITIES: Record<string, string> = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', shy: '\u00AD', plus: '+', period: '.', commat: '@',
}

// Files we can't read as text. Everything else is scanned. A PDF is scanned
// too, for its link addresses and title, which are plain bytes. Its page text
// is packed, so tests/unit/banned-words.test.ts reads that with tests/pdf.ts.
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
  // Twice-encoded text, like `%2545` or `&amp;#69;`, takes more than one round.
  let decoded = text
  for (let round = 0; round < 3; round++) {
    const next = decodeOnce(decoded)
    if (next === decoded) break
    decoded = next
  }
  return decoded
    .normalize('NFKC')
    .replace(INVISIBLE, '')
}

function decodeOnce(text: string): string {
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
}

/** Decodes JS escapes (`\u0045`, `\u{45}`, `\x45`) and CSS escapes (`\45 `). */
export function decodeEscapes(text: string): string {
  return text.replace(ESCAPE, (m, braced?: string, unit?: string, byte?: string, css?: string) => {
    if (unit) return String.fromCharCode(Number.parseInt(unit, 16))
    return codePoint(Number.parseInt(braced ?? byte ?? css ?? '', 16), m)
  })
}

/** Folds Cyrillic, Greek and Armenian letters that look like Latin ones into Latin. */
export function foldConfusables(text: string): string {
  return text.normalize('NFD').replace(CONFUSABLES, letter => CONFUSABLE[letter] ?? letter).normalize('NFC')
}

/**
 * Every word in a line, lowercased: plain words, the pieces of camelCase names
 * and of words glued to digits, joined words whole, and each ending of a dotted
 * word, so `www.example.co.nz` and `me@example.co.nz` both give `example.co.nz`.
 */
export function words(text: string): string[] {
  return wordsOf(normalize(text))
}

function stripAccents(word: string): string {
  // Plain ASCII has no accents. Skipping it keeps the scan of the built site fast.
  if (!/\P{ASCII}/u.test(word)) return word
  return word.normalize('NFD').replace(/\p{M}/gu, '').normalize('NFC')
}

function wordsOf(clean: string): string[] {
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
  for (const word of [...found]) found.add(stripAccents(word))
  for (const word of lower.match(DOTTED) ?? []) {
    const labels = word.split('.')
    for (let i = 0; i < labels.length - 1; i++) found.add(labels.slice(i).join('.'))
  }
  return [...found]
}

/**
 * The ways a line can read once its tricks are undone: the line itself, then
 * with JS and CSS escapes decoded (also when an entity or a %-code hid the
 * backslash), with tags removed, and with lookalike letters folded to Latin. Each is normalized. A pass is kept beside
 * the line, never in its place, so a word in a tag's attribute or next to a
 * regex `\b` is still read as it is.
 */
export function readings(text: string): string[] {
  const plain = normalize(text)
  const found = new Set([plain])
  if (text.includes('\\')) found.add(normalize(decodeEscapes(text)))
  if (plain.includes('\\')) found.add(normalize(decodeEscapes(plain)))
  for (const clean of [...found]) if (clean.includes('<')) found.add(clean.replace(TAG, ''))
  for (const clean of [...found]) {
    const folded = foldConfusables(clean)
    if (folded !== clean) found.add(folded)
  }
  return [...found]
}

/**
 * Adds runs of words in a row (see MAX_JOINED), joined with nothing and with a space,
 * so a name split by a space, a dash, a dot, an underscore or Markdown marks is
 * still checked whole.
 */
function addJoinedWords(clean: string, found: Set<string>): void {
  // Only words with soft marks between them are joined: spaces, dashes, dots,
  // underscores and Markdown marks. Code like `a(b)` or `x=y` is not.
  // Tags are gone already in the reading without tags.
  const runs: string[][] = []
  const ascii = !/\P{ASCII}/u.test(clean)
  for (const stretch of clean.toLowerCase().split(HARD_BREAK)) {
    const parts = stretch.match(WORD)
    if (!parts || parts.length < 2) continue
    runs.push(parts)
    // The words without accents too. Plain ASCII has none, so it is skipped.
    if (!ascii) runs.push(parts.map(stripAccents))
  }
  for (const run of runs) {
    for (let i = 0; i < run.length; i++) {
      let glued = run[i] ?? ''
      let spaced = glued
      const last = Math.min(i + MAX_JOINED_PIECES, run.length)
      for (let j = i + 1; j < last; j++) {
        if (j >= i + MAX_JOINED && glued.length + (run[j]?.length ?? 0) > MAX_JOINED_LENGTH) break
        glued += run[j]
        spaced += ` ${run[j]}`
        found.add(glued)
        found.add(spaced)
      }
    }
  }
}

/** Every string a line is checked against: the words of each reading, and runs of them joined. */
export function candidates(text: string): string[] {
  const found = new Set<string>()
  for (const clean of readings(text)) {
    for (const word of wordsOf(clean)) found.add(word)
    addJoinedWords(clean, found)
  }
  return [...found]
}

export function scanText(text: string, banned: ReadonlySet<string>, file = '<text>', firstLine = 1): Hit[] {
  const hits: Hit[] = []
  text.split(/\r?\n/).forEach((content, index) => {
    const line = firstLine + index
    for (const word of candidates(content)) {
      const hash = sha256(word)
      if (banned.has(hash)) hits.push({ file, line, kind: 'banned-word', detail: hash })
    }
    // One hit per number, even when more than one reading shows it.
    const phones = new Map<string, string>()
    for (const clean of readings(content)) {
      for (const match of [...clean.matchAll(VN_PHONE), ...clean.matchAll(VN_WHATSAPP)]) {
        const key = match[0].replace(/\D/g, '').slice(-8)
        if (!phones.has(key)) phones.set(key, `${match[0].slice(0, 3)}…`)
      }
    }
    for (const detail of phones.values()) hits.push({ file, line, kind: 'vn-phone', detail })
  })
  return hits
}

/**
 * Every file under the given folders, binary or not. Folders that don't exist
 * are skipped. A symlink counts as a file and is not followed.
 */
export function allFiles(dirs: string[]): string[] {
  const files: string[] = []
  const walk = (dir: string) => {
    for (const name of readdirSync(dir)) {
      const path = join(dir, name)
      if (lstatSync(path).isDirectory()) walk(path)
      else files.push(path)
    }
  }
  for (const dir of dirs) if (existsSync(dir)) walk(dir)
  return files
}

/** A regular file, or a symlink to one. A broken symlink is not readable. */
function isReadable(path: string): boolean {
  try {
    return statSync(path).isFile()
  }
  catch {
    return false
  }
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
    ...(isText(file) && isReadable(file) ? scanText(readText(file), banned, file) : []),
  ])
}

/**
 * One line per hit. In the path, any folder or file name that holds a banned
 * word is shown as `<hidden>`, so the report never prints the word. When the
 * hit is spread over more than one name, like a phone number split over folder names, the whole
 * path is hidden.
 */
export function formatHits(hits: Hit[], root: string, banned: ReadonlySet<string>): string {
  const hide = (path: string) => {
    const shown = path
      .split('/')
      .map(part => (scanText(part, banned).length > 0 ? '<hidden>' : part))
      .join('/')
    return scanText(shown, banned).length > 0 ? '<hidden>' : shown
  }
  return hits
    .map(hit => `${hide(relative(root, hit.file))}:${hit.line} ${hit.kind} ${hit.detail}`)
    .join('\n')
}
