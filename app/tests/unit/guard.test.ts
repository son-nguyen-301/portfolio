import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, describe, expect, it } from 'vitest'
import { scanFiles, scanText, sha256, textFiles, words } from '../guard'

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

  it('gives the domain inside a longer host name or an email address', () => {
    expect(words('www.example.co.nz')).toContain('example.co.nz')
    expect(words('me@example.co.nz')).toContain('example.co.nz')
  })

  it('keeps letters with Vietnamese marks', () => {
    expect(words('Nguyễn Hải Sơn')).toEqual(['nguyễn', 'hải', 'sơn'])
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

  it('passes clean text and words that only contain a banned word', () => {
    expect(scanText('A New Zealand e-commerce company', banned)).toEqual([])
    expect(scanText('examplecorporation', banned)).toEqual([])
  })

  it.each([
    '+84 912 345 678',
    '+84912345678',
    'tel:+84-912-345-678',
    '(+84) 28 3822 1234',
    '"+84.912.345.678"',
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
  ])('passes %s', (text) => {
    expect(scanText(text, banned)).toEqual([])
  })
})

describe('scanFiles', () => {
  const dir = mkdtempSync(join(tmpdir(), 'guard-'))
  afterAll(() => rmSync(dir, { recursive: true, force: true }))

  it('walks folders, skips binary files and missing folders, and finds the fixture', () => {
    mkdirSync(join(dir, 'nested'))
    writeFileSync(join(dir, 'clean.md'), 'Nothing to see here.')
    writeFileSync(join(dir, 'nested', 'dirty.yml'), 'company: ExampleCorp')
    writeFileSync(join(dir, 'logo.png'), SAMPLE)

    const files = textFiles([dir, join(dir, 'missing')])
    expect(files.map(file => file.replace(dir, ''))).toEqual(['/clean.md', '/nested/dirty.yml'])

    const hits = scanFiles(files, banned)
    expect(hits).toHaveLength(1)
    expect(hits[0]?.file).toBe(join(dir, 'nested', 'dirty.yml'))
  })
})
