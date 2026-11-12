// `pnpm report:todo` (lib/todo.ts, PF-024), and docs/open-items.md, which must
// list exactly the TODOs and drafts the report finds in content.
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { findTodos, formatReport, isDraft, pageTodos, todoReport, visibleText } from '../../lib/todo'

const app = fileURLToPath(new URL('../..', import.meta.url))
const repo = fileURLToPath(new URL('../../..', import.meta.url))

describe('findTodos', () => {
  it('lists each line with a TODO, with its number', () => {
    expect(findTodos('a: 1\nalt: "TODO: screenshot"\nb: TODOS\n  caption: TODO\n', 'x.yml')).toEqual([
      { file: 'x.yml', line: 2, text: 'alt: "TODO: screenshot"' },
      { file: 'x.yml', line: 4, text: 'caption: TODO' },
    ])
  })
})

describe('visibleText and pageTodos', () => {
  it('keeps only the words a visitor sees', () => {
    const html = '<html><head><meta name="description" content="TODO head"></head><body><p>Hi &amp; <b>bye</b></p><script>const a = "TODO"</script><!-- TODO --><img alt="TODO alt"></body></html>'
    expect(visibleText(html)).toBe('Hi & bye')
    expect(pageTodos(html, 'a.html')).toEqual([])
  })

  it('finds a TODO in the page text, with the words around it', () => {
    expect(pageTodos('<body><footer><p>This site: Lighthouse TODO, built with Nuxt.</p></footer></body>', 'index.html'))
      .toEqual([{ file: 'index.html', line: 0, text: 'This site: Lighthouse TODO, built with Nuxt.' }])
  })
})

describe('isDraft', () => {
  it('reads status from the front matter only', () => {
    expect(isDraft('---\ntitle: A\nstatus: draft\n---\nBody')).toBe(true)
    expect(isDraft('---\ntitle: A\nstatus: ready\n---\nstatus: draft')).toBe(false)
    expect(isDraft('No front matter')).toBe(false)
  })
})

describe('todoReport', () => {
  it('reports content, drafts and built pages, and says when there is no build', () => {
    const root = mkdtempSync(join(tmpdir(), 'todo-'))
    const appDir = join(root, 'app')
    mkdirSync(join(appDir, 'content/work'), { recursive: true })
    writeFileSync(join(appDir, 'content/profile.yml'), 'name: A\nnote: "TODO: a fact"\n')
    writeFileSync(join(appDir, 'content/work/one.md'), '---\nstatus: draft\n---\nText')
    writeFileSync(join(appDir, 'content/work/two.md'), '---\nstatus: ready\n---\nText')
    const before = todoReport(appDir, root)
    expect(before).toEqual({
      content: [{ file: 'app/content/profile.yml', line: 2, text: 'note: "TODO: a fact"' }],
      drafts: ['app/content/work/one.md'],
    })
    expect(formatReport(before)).toContain('No build in .output/public. Run `pnpm generate` first.')

    mkdirSync(join(appDir, '.output/public/about'), { recursive: true })
    writeFileSync(join(appDir, '.output/public/about/index.html'), '<body><p>Born in TODO.</p></body>')
    writeFileSync(join(appDir, '.output/public/200.html'), '<body>TODO</body>')
    const after = todoReport(appDir, root)
    expect(after.pages).toEqual([{ file: 'app/.output/public/about/index.html', line: 0, text: 'Born in TODO.' }])
    expect(formatReport(after)).toContain('- `app/.output/public/about/index.html`: Born in TODO.')
  })
})

describe('docs/open-items.md', () => {
  const items = readFileSync(join(repo, 'docs/open-items.md'), 'utf8')
  const report = todoReport(app, repo)
  // A content TODO is listed as: `file`: "the quoted TODO note"
  const note = (text: string) => /"([^"]*\bTODO\b[^"]*)"/.exec(text)?.[1] ?? text
  const listedTodos = [...items.matchAll(/^- \[ \] `(app\/content\/[^`]+)`: "([^"]*\bTODO\b[^"]*)"/gm)].map(match => `${match[1]}: ${match[2]}`)
  const listedDrafts = [...items.matchAll(/^- \[ \] `(app\/content\/work\/[^`]+)`: `status: draft`/gm)].map(match => match[1])

  it('lists every TODO in content, and no TODO that is gone', () => {
    expect(listedTodos.sort()).toEqual(report.content.map(item => `${item.file}: ${note(item.text)}`).sort())
  })

  it('lists every draft case study, and no draft that is ready', () => {
    expect(listedDrafts.sort()).toEqual([...report.drafts].sort())
  })
})
