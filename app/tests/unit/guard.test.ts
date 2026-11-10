import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { allFiles, formatHits, normalize, readText, scanFiles, scanText, sha256, words } from '../guard'

// A made-up name that stands in for a banned word in these tests.
const SAMPLE = 'examplecorp'
const banned = new Set([sha256(SAMPLE), sha256('examplecorp.co.nz')])

describe('sha256', () => {
  it('hashes a word to hex', () => {
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('words', () => {
  it('lowercases and splits on anything that is not a letter or digit', () => {
    expect(words('Hello, World! 2026')).toEqual(['hello', 'world', '2026'])
  })

  it('keeps dotted words like domains whole, as well as their parts', () => {
    expect(words('see Example.co.nz now')).toEqual(['see', 'example', 'co', 'nz', 'now', 'example.co.nz', 'co.nz'])
  })

  it('gives the pieces of camelCase names and of words glued to digits', () => {
    expect(words('myExampleCorpLogo')).toEqual(expect.arrayContaining(['example', 'corp', 'examplecorp', 'logo']))
    expect(words('examplecorp2026')).toContain('examplecorp')
  })

  it('gives a domain glued to other words with a dash', () => {
    expect(words('example.co.nz-logo.png')).toContain('example.co.nz')
  })

  it('gives the domain inside a longer host name or an email address', () => {
    expect(words('www.example.co.nz')).toContain('example.co.nz')
    expect(words('me@example.co.nz')).toContain('example.co.nz')
  })

  it('keeps letters with Vietnamese marks, and also gives each word without them', () => {
    expect(words('Nguyễn Hải Sơn')).toEqual(['nguyễn', 'hải', 'sơn', 'nguyen', 'hai', 'son'])
  })

  it('splits an all-caps prefix from the next word', () => {
    expect(words('ACMEWidget')).toEqual(expect.arrayContaining(['acme', 'widget']))
    expect(words('SVGExampleCorpLogo')).toContain('examplecorp')
  })
})

describe('normalize', () => {
  it('decodes HTML entities and %-codes', () => {
    expect(normalize('&#69;xample &#x43;orp &amp; %2B84')).toBe('Example Corp & +84')
  })

  it('folds fullwidth letters and drops invisible characters', () => {
    expect(normalize('\uFF25xample')).toBe('Example')
    expect(normalize('ex\u200Bam\u00ADple\u2060corp')).toBe('examplecorp')
  })

  it('leaves broken codes alone', () => {
    expect(normalize('100% sure, %E0%A4%A and &bogus;')).toBe('100% sure, %E0%A4%A and &bogus;')
  })
})

describe('scanText', () => {
  it('fails on a banned word in any case, and reports the hash, not the word', () => {
    const hits = scanText(`first line\nI worked at ExampleCorp.`, banned, 'fixture.md')
    expect(hits).toEqual([{ file: 'fixture.md', line: 2, kind: 'banned-word', detail: sha256(SAMPLE) }])
    expect(JSON.stringify(hits)).not.toContain(SAMPLE)
  })

  it('fails on a banned domain inside a URL or an email address', () => {
    const domain = sha256('examplecorp.co.nz')
    expect(scanText('https://www.examplecorp.co.nz/about', banned).map(hit => hit.detail)).toContain(domain)
    expect(scanText('mailto:jobs@examplecorp.co.nz', banned).map(hit => hit.detail)).toContain(domain)
  })

  it('fails on a word inside markup or code', () => {
    expect(scanText('<p class="x">examplecorp</p>', banned)).toHaveLength(1)
    expect(scanText('const company = "EXAMPLECORP"', banned)).toHaveLength(1)
  })

  it.each([
    ['an invisible character', 'Example\u200BCorp'],
    ['fullwidth letters', '\uFF45\uFF58\uFF41\uFF4D\uFF50\uFF4C\uFF45\uFF43\uFF4F\uFF52\uFF50'],
    ['HTML entities', '&#69;xample&#x43;orp'],
    ['%-codes', 'https://x.test/?q=%45xampleCorp'],
    ['a camelCase name', 'const exampleCorpUrl = 1'],
    ['an all-caps prefix', 'EXAMPLECORPLogo'],
    ['a combining accent', 'e\u0301xamplecorp'],
    ['a grapheme joiner', 'example\u034Fcorp'],
    ['a Hangul filler', 'example\u3164corp'],
    ['a supplement variation selector', 'example\u{E0100}corp'],
    ['a Mongolian variation selector', 'example\u180Bcorp'],
    ['a strikethrough mark', 'examplec\u0336orp'],
  ])('fails on a banned word hidden by %s', (_, text) => {
    expect(scanText(text, banned).map(hit => hit.detail)).toContain(sha256(SAMPLE))
  })

  it('passes clean text and words that only contain a banned word', () => {
    expect(scanText('A New Zealand e-commerce company', banned)).toEqual([])
    expect(scanText('examplecorporation', banned)).toEqual([])
  })

  it.each([
    '+84 900 000 000',
    '+84900000000',
    'tel:+84-900-000-000',
    '(+84) 28 0000 0000',
    '"+84.900.000.000"',
    '0084 900 000 000',
    '+ 84 900 000 000',
    '&#43;84900000000',
    'tel:%2B84900000000',
    'https://wa.me/84900000000',
    'https://api.whatsapp.com/send?phone=84900000000',
    '+84/900/000/000',
    '+84_900_000_000',
    '+84\u2013900\u2013000\u2013000',
  ])('fails on the Vietnamese phone number %s', (text) => {
    const hits = scanText(text, banned)
    expect(hits).toHaveLength(1)
    expect(hits[0]?.kind).toBe('vn-phone')
    expect(hits[0]?.detail).not.toMatch(/\d{4}/)
  })

  it.each([
    'UTC+7 and +84 alone',
    '+64 21 123 4567',
    'x=a+840000000',
    'f(1)+841234567',
    'id=1008412345678',
  ])('passes %s', (text) => {
    expect(scanText(text, banned)).toEqual([])
  })
})

describe('scanFiles', () => {
  const dir = mkdtempSync(join(tmpdir(), 'guard-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('walks folders, skips missing folders, reads only text files, and finds the fixture', () => {
    mkdirSync(join(dir, 'nested'))
    writeFileSync(join(dir, 'clean.md'), 'Nothing to see here.')
    writeFileSync(join(dir, 'nested', 'dirty.yml'), 'company: ExampleCorp')
    writeFileSync(join(dir, 'logo.png'), SAMPLE)

    const files = allFiles([dir, join(dir, 'missing')])
    expect(files.map(file => file.replace(dir, '')).sort()).toEqual(['/clean.md', '/logo.png', '/nested/dirty.yml'])

    const hits = scanFiles(files, banned, dir)
    expect(hits).toHaveLength(1)
    expect(hits[0]?.file).toBe(join(dir, 'nested', 'dirty.yml'))
  })

  it.each(['examplecorp-logo.svg', 'examplecorp-logo.png', 'ExampleCorp/logo.webp'])('checks the file or folder name %s', (name) => {
    const named = join(dir, name)
    mkdirSync(join(named, '..'), { recursive: true })
    writeFileSync(named, '<svg></svg>')
    const hits = scanFiles([named], banned, dir)
    expect(hits).toEqual([{ file: named, line: 0, kind: 'banned-word', detail: sha256(SAMPLE) }])
    expect(formatHits(hits, dir, banned).toLowerCase()).not.toContain(SAMPLE)
    expect(formatHits(hits, dir, banned)).toContain('<hidden>')
    rmSync(named)
  })

  it('checks the name of a broken symlink without following it', () => {
    const link = join(dir, 'examplecorp-logo.png')
    symlinkSync(join(dir, 'missing-target.png'), link)
    expect(allFiles([dir])).toContain(link)
    const hits = scanFiles([link], banned, dir)
    expect(hits).toEqual([{ file: link, line: 0, kind: 'banned-word', detail: sha256(SAMPLE) }])
    rmSync(link)
  })

  it('unpacks a base64 gzip file, like the Nuxt Content dump', () => {
    const dump = join(dir, 'sql_dump.txt')
    writeFileSync(dump, gzipSync('INSERT INTO work VALUES (\'ExampleCorp\');').toString('base64'))
    expect(readText(dump)).toContain('ExampleCorp')
    expect(scanFiles([dump], banned, dir)).toHaveLength(1)
    rmSync(dump)
  })
})
