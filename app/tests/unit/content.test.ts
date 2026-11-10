// Checks every file in app/content/ against its schema, and that broken
// files are caught. modules/content-check.ts runs the same check on build.
import { cpSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import {
  caseStudies,
  checkContent,
  checkFile,
  checkOnStart,
  collectionFor,
  formatIssues,
  headingsOf,
  matchesSource,
  splitFrontMatter,
} from '../../lib/content-check'
import { collections } from '../../shared/content/schemas'

const contentDir = fileURLToPath(new URL('../../content', import.meta.url))

describe('app/content', () => {
  const report = checkContent(contentDir)

  it('passes every schema', () => {
    expect(formatIssues(report.issues)).toBe('')
  })

  it('has a file for each of the 7 collections', () => {
    expect(Object.keys(collections).sort()).toEqual(['earlier', 'lab', 'profile', 'services', 'skills', 'timeline', 'work'])
    for (const name of Object.keys(collections)) {
      expect(report.entries.some(entry => entry.collection === name), name).toBe(true)
    }
  })

  it('lists the 6 case studies in order', () => {
    expect(caseStudies(report).map(study => [study.order, study.slug])).toEqual([
      [1, 'nz-storefront-speed-ui-swap'],
      [2, 'nz-ai-dev-team'],
      [3, 'nz-storefront-from-zero'],
      [4, 'aspire-multi-currency'],
      [5, 'aspire-redesign'],
      [6, 'paymentwall-terminal3'],
    ])
  })
})

describe('a broken content folder', () => {
  let dir = ''
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = ''
  })

  // A copy of app/content/ with one file changed.
  function broken(file: string, change: (text: string) => string) {
    dir = mkdtempSync(join(tmpdir(), 'content-'))
    cpSync(contentDir, dir, { recursive: true })
    const before = readFileSync(join(dir, file), 'utf8')
    const after = change(before)
    expect(after).not.toBe(before)
    writeFileSync(join(dir, file), after)
    return formatIssues(checkContent(dir).issues)
  }

  it('fails on a field of the wrong type', () => {
    expect(broken('work/aspire-redesign.md', text => text.replace('order: 5', 'order: five')))
      .toContain('content/work/aspire-redesign.md: order:')
  })

  it('fails on a missing field', () => {
    expect(broken('profile.yml', text => text.replace(/^title: .*\n/m, '')))
      .toContain('content/profile.yml: title:')
  })

  it('fails on a field the schema does not know, such as a typo', () => {
    expect(broken('lab/looper.yml', text => text.replace('summary:', 'sumary:')))
      .toMatch(/content\/lab\/looper\.yml: .*sumary/)
  })

  it('fails on a value outside the allowed list', () => {
    expect(broken('work/aspire-redesign.md', text => text.replace('status: draft', 'status: done')))
      .toContain('content/work/aspire-redesign.md: status:')
  })

  it('fails on a link that is not https', () => {
    expect(broken('profile.yml', text => text.replace('github: https://', 'github: http://')))
      .toContain('content/profile.yml: links.github:')
  })

  it('fails on YAML that does not parse', () => {
    expect(broken('skills.yml', text => text.replace('groups:', 'groups: [')))
      .toContain('content/skills.yml: Not valid YAML')
  })

  it('fails on case study headings out of order', () => {
    expect(broken('work/paymentwall-terminal3.md', text => text.replace('## The result', '## Results')))
      .toContain('content/work/paymentwall-terminal3.md: Body headings must be')
  })

  it('fails on a diagram with no component name', () => {
    expect(broken('lab/task-runner.yml', text => text.replace(/^ {2}src: .*\n/m, '')))
      .toContain('content/lab/task-runner.yml: media.src:')
  })

  it('fails on two case studies with the same order', () => {
    expect(broken('work/aspire-redesign.md', text => text.replace('order: 5', 'order: 4')))
      .toMatch(/content\/work\/(aspire-redesign|aspire-multi-currency)\.md: order: 4 is also used by/)
  })

  it('fails on a service whose proof is not a case study', () => {
    expect(broken('services.yml', text => text.replace('proof: [nz-ai-dev-team]', 'proof: [nz-ai-team]')))
      .toContain('content/services.yml: items.4.proof: no case study "work/nz-ai-team.md"')
  })

  it('fails on a file that no collection reads', () => {
    dir = mkdtempSync(join(tmpdir(), 'content-'))
    cpSync(contentDir, dir, { recursive: true })
    writeFileSync(join(dir, 'work', 'notes.yml'), 'title: x\n')
    expect(formatIssues(checkContent(dir).issues)).toContain('content/work/notes.yml: Not part of any collection')
  })

  it('fails when a collection has no file', () => {
    dir = mkdtempSync(join(tmpdir(), 'content-'))
    cpSync(contentDir, dir, { recursive: true })
    unlinkSync(join(dir, 'earlier.yml'))
    expect(formatIssues(checkContent(dir).issues)).toContain('content/earlier.yml: Missing: the earlier collection has no file')
  })
})

describe('checkOnStart', () => {
  let dir = ''
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true })
    dir = ''
  })

  function brokenCopy() {
    dir = mkdtempSync(join(tmpdir(), 'content-'))
    cpSync(contentDir, dir, { recursive: true })
    writeFileSync(join(dir, 'skills.yml'), 'groups: []\n')
    return dir
  }

  it('stays quiet on good content', () => {
    const log: string[] = []
    expect(() => checkOnStart(contentDir, { dev: false, log: message => log.push(message) })).not.toThrow()
    expect(log).toEqual([])
  })

  it('stops a build on broken content', () => {
    expect(() => checkOnStart(brokenCopy(), { dev: false, log: () => {} }))
      .toThrow('1 problem(s) in content/:\n  content/skills.yml: groups:')
  })

  it('only logs in the dev server', () => {
    const log: string[] = []
    expect(() => checkOnStart(brokenCopy(), { dev: true, log: message => log.push(message) })).not.toThrow()
    expect(log[0]).toContain('content/skills.yml: groups:')
  })
})

describe('checkFile', () => {
  it('fails on a case study with no front matter', () => {
    expect(checkFile('work/x.md', '## The problem\n').issues[0]?.message).toBe('Missing front matter between "---" lines')
  })

  it('fails on a case study file name that is not a clean address', () => {
    const text = readFileSync(join(contentDir, 'work/aspire-redesign.md'), 'utf8')
    expect(checkFile('work/Aspire_Redesign.md', text).issues.map(issue => issue.message))
      .toEqual(['The file name becomes the page address, so use lowercase words joined by dashes'])
  })
})

describe('matchesSource and collectionFor', () => {
  it('matches a fixed file name exactly', () => {
    expect(matchesSource('profile.yml', 'profile.yml')).toBe(true)
    expect(matchesSource('profile.yml', 'lab/profile.yml')).toBe(false)
  })

  it('lets * stand for one file name, never a folder', () => {
    expect(matchesSource('work/*.md', 'work/a.md')).toBe(true)
    expect(matchesSource('work/*.md', 'work/old/a.md')).toBe(false)
    expect(matchesSource('work/*.md', 'work/.md')).toBe(false)
    expect(matchesSource('work/*.md', 'work/a.yml')).toBe(false)
  })

  it('finds the collection of a file', () => {
    expect(collectionFor('work/a.md')).toBe('work')
    expect(collectionFor('lab/a.yml')).toBe('lab')
    expect(collectionFor('timeline.yml')).toBe('timeline')
    expect(collectionFor('lab/a.yaml')).toBeUndefined()
  })
})

describe('splitFrontMatter', () => {
  it('splits the YAML from the body', () => {
    expect(splitFrontMatter('---\na: 1\n---\n\n## Hi\n')).toEqual({ frontMatter: 'a: 1', body: '\n## Hi\n' })
  })

  it('reads Windows line ends', () => {
    expect(splitFrontMatter('---\r\na: 1\r\n---\r\nbody')).toEqual({ frontMatter: 'a: 1', body: 'body' })
  })

  it('gives nothing without front matter', () => {
    expect(splitFrontMatter('## Hi\n')).toBeUndefined()
  })
})

describe('headingsOf', () => {
  it('lists ## headings and skips other levels and code blocks', () => {
    const body = '# Top\n## One\ntext\n### Sub\n```md\n## Not a heading\n```\n## Two ##\n'
    expect(headingsOf(body)).toEqual(['One', 'Two'])
  })
})
