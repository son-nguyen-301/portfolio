// `pnpm report:todo` (PF-024, D-039): every TODO left in content and on the
// built pages, and the case studies still marked `status: draft`, so
// docs/open-items.md can be kept in step with them. scripts/report-todo.ts
// prints the report; tests/unit/todo.test.ts checks docs/open-items.md lists
// the content part.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

export interface Todo {
  // A path from the repo root, for example `app/content/lab/looper.yml`.
  file: string
  line: number
  text: string
}

const todo = /\bTODO\b/

// Each line of a file that holds a TODO, trimmed.
export function findTodos(text: string, file: string): Todo[] {
  return text.split('\n').flatMap((line, index) => todo.test(line) ? [{ file, line: index + 1, text: line.trim() }] : [])
}

// The words a visitor sees on a built page: no scripts, styles, comments or
// tags. Head tags are left out too, so a TODO in a meta tag is not counted.
export function visibleText(html: string): string {
  const body = /<body\b[^>]*>([\s\S]*)<\/body>/i.exec(html)?.[1] ?? html
  return body
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, '\'')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim()
}

// Each TODO a visitor sees on a page, with the words around it.
export function pageTodos(html: string, file: string): Todo[] {
  const text = visibleText(html)
  return [...text.matchAll(/\bTODO\b/g)].map((match) => {
    const start = Math.max(0, match.index - 40)
    return { file, line: 0, text: text.slice(start, match.index + 60).trim() }
  })
}

// A case study whose front matter says `status: draft`: Son still has to
// check its facts (docs/content-model.md).
export function isDraft(markdown: string): boolean {
  const front = /^---\n([\s\S]*?)\n---/.exec(markdown)?.[1] ?? ''
  return /^status:\s*["']?draft["']?\s*$/m.test(front)
}

function filesIn(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(item => item.isFile())
    .map(item => join(item.parentPath, item.name))
    .sort()
}

const fromRepo = (repo: string, file: string) => relative(repo, file).split(sep).join('/')

export interface TodoReport {
  content: Todo[]
  drafts: string[]
  // Undefined when there is no build.
  pages?: Todo[]
}

// `app` is the app folder (with content/ and .output/public), `repo` the repo
// root that paths are written from.
export function todoReport(app: string, repo: string): TodoReport {
  const contentDir = join(app, 'content')
  const contentFiles = filesIn(contentDir).filter(file => /\.(?:ya?ml|md|json)$/.test(file))
  const content = contentFiles.flatMap(file => findTodos(readFileSync(file, 'utf8'), fromRepo(repo, file)))
  const drafts = contentFiles
    .filter(file => file.startsWith(join(contentDir, 'work') + sep) && file.endsWith('.md'))
    .filter(file => isDraft(readFileSync(file, 'utf8')))
    .map(file => fromRepo(repo, file))
  const built = join(app, '.output/public')
  if (!existsSync(built)) return { content, drafts }
  const pages = filesIn(built)
    .filter(file => file.endsWith('.html') && !file.endsWith(`${sep}200.html`))
    .flatMap(file => pageTodos(readFileSync(file, 'utf8'), fromRepo(repo, file)))
  return { content, drafts, pages }
}

export function formatReport(report: TodoReport): string {
  const list = (items: string[]) => items.length ? items.map(item => `- ${item}`).join('\n') : 'None.'
  return [
    '# TODO report',
    '',
    `## TODOs in content (${report.content.length})`,
    '',
    list(report.content.map(item => `\`${item.file}:${item.line}\`: ${item.text}`)),
    '',
    `## Case studies with \`status: draft\` (${report.drafts.length})`,
    '',
    list(report.drafts.map(file => `\`${file}\``)),
    '',
    report.pages ? `## TODOs a visitor sees on the built pages (${report.pages.length})` : '## TODOs a visitor sees on the built pages',
    '',
    report.pages ? list(report.pages.map(item => `\`${item.file}\`: ${item.text}`)) : 'No build in .output/public. Run `pnpm generate` first.',
    '',
  ].join('\n')
}
