// Scans the site's source and, once built, the generated site for banned words
// and Vietnamese phone numbers. CLAUDE.md hard rules 1 and 3.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { allFiles, formatHits, scanFiles } from '../guard'

const root = fileURLToPath(new URL('../..', import.meta.url)).replace(/\/$/, '')
const banned = new Set<string>(JSON.parse(readFileSync(`${root}/tests/banned-words.json`, 'utf8')))
const repo = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const built = `${root}/.output/public`
// CI sets this after `pnpm generate`, so a missing build fails instead of skipping.
const requireBuilt = process.env.GUARD_REQUIRE_BUILD === '1'

describe('banned-words guard', () => {
  it('has the hash list', () => {
    expect(banned.size).toBe(5)
    for (const hash of banned) expect(hash).toMatch(/^[0-9a-f]{64}$/)
  })

  it('finds nothing in app/content, app/app and app/public', () => {
    const files = allFiles([`${root}/content`, `${root}/app`, `${root}/public`])
    expect(files.length).toBeGreaterThan(0)
    expect(formatHits(scanFiles(files, banned, root), root, banned)).toBe('')
  })

  // The repo is public, so docs, config and CI files count too. The guard's own
  // tests hold made-up phone numbers, so only phone hits in that file are let through.
  const tracked = (() => {
    try {
      return execFileSync('git', ['ls-files', '-z'], { cwd: repo, encoding: 'utf8' }).split('\0').filter(Boolean)
    }
    catch {
      return []
    }
  })()

  // In CI a missing git fails the test instead of skipping it.
  it.skipIf(tracked.length === 0 && !process.env.CI)('finds nothing in any file tracked by git', () => {
    expect(tracked.length).toBeGreaterThan(0)
    const fixtures = `${repo}/app/tests/unit/guard.test.ts`
    const files = tracked.map(file => `${repo}/${file}`).filter(file => existsSync(file))
    const hits = scanFiles(files, banned, repo)
      .filter(hit => !(hit.file === fixtures && hit.kind === 'vn-phone'))
    expect(formatHits(hits, repo, banned)).toBe('')
  })

  it.skipIf(!existsSync(built) && !requireBuilt)('finds nothing in the generated site (.output/public)', () => {
    const files = allFiles([built])
    expect(files.length).toBeGreaterThan(0)
    expect(formatHits(scanFiles(files, banned, built), root, banned)).toBe('')
  })
})
