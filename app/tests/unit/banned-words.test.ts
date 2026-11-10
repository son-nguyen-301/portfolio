// Scans the site's source and, once built, the generated site for banned words
// and Vietnamese phone numbers. CLAUDE.md hard rules 1 and 3.
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { formatHits, scanFiles, textFiles } from '../guard'

const root = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '')
const banned = new Set<string>(JSON.parse(readFileSync(`${root}/tests/banned-words.json`, 'utf8')))
const built = `${root}/.output/public`
// CI sets this after `pnpm generate`, so a missing build fails instead of skipping.
const requireBuilt = process.env.GUARD_REQUIRE_BUILD === '1'

describe('banned-words guard', () => {
  it('has the hash list', () => {
    expect(banned.size).toBe(5)
    for (const hash of banned) expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('finds nothing in app/content, app/app and app/public', () => {
    const files = textFiles([`${root}/content`, `${root}/app`, `${root}/public`])
    expect(files.length).toBeGreaterThan(0)
    expect(formatHits(scanFiles(files, banned), root)).toBe('')
  })

  it.skipIf(!existsSync(built) && !requireBuilt)('finds nothing in the generated site (.output/public)', () => {
    const files = textFiles([built])
    expect(files.length).toBeGreaterThan(0)
    expect(formatHits(scanFiles(files, banned), root)).toBe('')
  })
})
