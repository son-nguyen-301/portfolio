// Checks every file in app/content/ against its schema in
// shared/content/schemas.ts. Nuxt Content only logs a warning and drops a file
// it cannot read, so modules/content-check.ts runs this and fails the build.
import { readdirSync, readFileSync } from 'node:fs'
import { join, posix } from 'node:path'
import { parse } from 'yaml'
import type { z } from 'zod'
import { collections, workSections } from '../shared/content/schemas'
import type { CaseStudyMeta, CollectionName, LabProject, Services } from '../shared/content/schemas'

export interface ContentIssue {
  // Path relative to app/content/, with "/" between folders.
  file: string
  message: string
}

export interface ContentEntry {
  collection: CollectionName
  file: string
  // The file name without its extension, for example "aspire-redesign".
  slug: string
  data: unknown
  // True when `data` passed the schema.
  valid: boolean
  // The `##` headings of a Markdown body, in order.
  headings?: string[]
}

export interface ContentReport {
  issues: ContentIssue[]
  entries: ContentEntry[]
}

const names = Object.keys(collections) as CollectionName[]

// Every file below `dir`, relative to it, skipping dot files such as .DS_Store.
export function listFiles(dir: string, prefix = ''): string[] {
  return readdirSync(join(dir, prefix), { withFileTypes: true })
    .filter(item => !item.name.startsWith('.'))
    .flatMap((item) => {
      const rel = prefix ? `${prefix}/${item.name}` : item.name
      return item.isDirectory() ? listFiles(dir, rel) : [rel]
    })
    .sort()
}

// Matches a source such as "work/*.md": `*` is one file name, never a folder.
export function matchesSource(source: string, file: string): boolean {
  if (!source.includes('*')) return source === file
  const [head, tail] = source.split('*') as [string, string]
  if (!file.startsWith(head) || !file.endsWith(tail)) return false
  const name = file.slice(head.length, file.length - tail.length)
  return name.length > 0 && !name.includes('/')
}

export function collectionFor(file: string): CollectionName | undefined {
  return names.find(name => matchesSource(collections[name].source, file))
}

// Splits a Markdown file into its YAML front matter and its body.
export function splitFrontMatter(text: string): { frontMatter: string, body: string } | undefined {
  const match = /^---\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/.exec(text)
  if (!match) return undefined
  return { frontMatter: match[1] ?? '', body: text.slice(match[0].length) }
}

// The `##` headings of a Markdown body, skipping fenced code blocks.
export function headingsOf(body: string): string[] {
  const headings: string[] = []
  let inFence = false
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(?:```|~~~)/.test(line)) inFence = !inFence
    else if (!inFence) {
      const match = /^##[ \t]+(.+?)[ \t#]*$/.exec(line)
      if (match?.[1]) headings.push(match[1])
    }
  }
  return headings
}

function schemaIssues(file: string, error: z.ZodError): ContentIssue[] {
  return error.issues.map(issue => ({
    file,
    message: `${issue.path.length ? issue.path.join('.') : '(file)'}: ${issue.message}`,
  }))
}

// Reads one file and checks it against its collection's schema.
export function checkFile(file: string, text: string): { issues: ContentIssue[], entry?: ContentEntry } {
  const collection = collectionFor(file)
  if (!collection) {
    return { issues: [{ file, message: 'Not part of any collection in content.config.ts, so no page can read it' }] }
  }
  const slug = posix.basename(file).replace(/\.[^.]+$/, '')
  const issues: ContentIssue[] = []
  let raw: unknown
  let headings: string[] | undefined
  let source = text
  if (file.endsWith('.md')) {
    const parts = splitFrontMatter(text)
    if (!parts) return { issues: [{ file, message: 'Missing front matter between "---" lines' }] }
    source = parts.frontMatter
    headings = headingsOf(parts.body)
    const expected = workSections.join(', ')
    if (headings.join(', ') !== expected) {
      issues.push({ file, message: `Body headings must be "## ${workSections.join('", "## ')}" in that order, found: ${headings.length ? headings.join(', ') : 'none'}` })
    }
  }
  try {
    raw = parse(source)
  }
  catch (error) {
    return { issues: [{ file, message: `Not valid YAML: ${error instanceof Error ? error.message.split('\n')[0] : String(error)}` }] }
  }
  if (collection === 'work' && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    issues.push({ file, message: 'The file name becomes the page address, so use lowercase words joined by dashes' })
  }
  const result = collections[collection].schema.safeParse(raw)
  if (!result.success) issues.push(...schemaIssues(file, result.error))
  return { issues, entry: { collection, file, slug, data: result.success ? result.data : raw, valid: result.success, headings } }
}

// Checks a whole content folder: every file, plus the rules that span files.
export function checkContent(dir: string): ContentReport {
  const issues: ContentIssue[] = []
  const entries: ContentEntry[] = []
  const files = listFiles(dir)
  for (const file of files) {
    const result = checkFile(file, readFileSync(join(dir, file), 'utf8'))
    issues.push(...result.issues)
    if (result.entry) entries.push(result.entry)
  }
  // The rules below only look at files that passed their schema.
  const valid = entries.filter(entry => entry.valid)

  for (const name of names) {
    const { source } = collections[name]
    if (!files.some(file => matchesSource(source, file))) {
      issues.push({ file: source, message: `Missing: the ${name} collection has no file` })
    }
  }

  for (const name of ['work', 'lab'] as const) {
    const seen = new Map<number, string>()
    for (const entry of valid.filter(item => item.collection === name)) {
      const { order } = entry.data as CaseStudyMeta | LabProject
      const other = seen.get(order)
      if (other) issues.push({ file: entry.file, message: `order: ${order} is also used by ${other}` })
      else seen.set(order, entry.file)
    }
  }

  const work = new Set(entries.filter(item => item.collection === 'work').map(item => item.slug))
  const services = valid.find(item => item.collection === 'services')
  for (const [index, service] of ((services?.data as Services | undefined)?.items ?? []).entries()) {
    for (const proof of service.proof) {
      if (!work.has(proof)) {
        issues.push({ file: services!.file, message: `items.${index}.proof: no case study "work/${proof}.md"` })
      }
    }
  }

  return { issues, entries }
}

// The case studies, sorted the way /work lists them.
export function caseStudies(report: ContentReport): Array<CaseStudyMeta & { slug: string }> {
  return report.entries
    .filter(item => item.collection === 'work')
    .map(item => ({ ...(item.data as CaseStudyMeta), slug: item.slug }))
    .sort((a, b) => a.order - b.order)
}

export function formatIssues(issues: ContentIssue[]): string {
  return issues.map(issue => `  content/${issue.file}: ${issue.message}`).join('\n')
}
