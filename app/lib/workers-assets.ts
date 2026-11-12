// How Cloudflare Workers static assets answers a request for the built site,
// as far as the quality checks need it (PF-022). scripts/serve-built.ts uses
// these rules to serve .output/public the way the live site is served:
// `html_handling: "drop-trailing-slash"`, `not_found_handling: "404-page"`
// (app/wrangler.jsonc), the headers from `_headers`, and compressed text.
//
// Docs: https://developers.cloudflare.com/workers/static-assets/routing/
// and https://developers.cloudflare.com/workers/static-assets/headers/
import { extname } from 'node:path'

export interface HeaderRule {
  // The path pattern, for example `/*` or `/_nuxt/*`.
  path: string
  // Header names in lower case, with their values.
  headers: [string, string][]
  // Headers a broader rule set, dropped with "! Name".
  detach: string[]
}

// Reads `_headers`: a path line, then indented "Name: value" lines or
// "! Name" lines. Blank lines and lines that start with # are skipped.
export function readHeaderRules(text: string): HeaderRule[] {
  const rules: HeaderRule[] = []
  let current: HeaderRule | undefined
  for (const line of text.split('\n')) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    if (!/^\s/.test(line)) {
      current = { path: line.trim(), headers: [], detach: [] }
      rules.push(current)
      continue
    }
    if (!current) throw new Error(`A header line before any path in _headers: ${line}`)
    const detached = line.match(/^\s+!\s*(\S+)\s*$/)
    if (detached) {
      current.detach.push(detached[1]!.toLowerCase())
      continue
    }
    const match = line.match(/^\s+([^:]+):\s*(.*)$/)
    if (!match) throw new Error(`Not a header line in _headers: ${line}`)
    current.headers.push([match[1]!.trim().toLowerCase(), match[2]!.trim()])
  }
  return rules
}

// A path pattern matches the whole path. `*` matches any run of characters.
export function pathMatches(pattern: string, path: string): boolean {
  const source = pattern.split('*').map(part => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('.*')
  return new RegExp(`^${source}$`).test(path)
}

// The headers for one path. Rules apply in file order; a later rule's
// "! Name" drops what an earlier one set. Two rules that set the same header
// are joined with a comma, as Workers does.
export function headersFor(rules: HeaderRule[], path: string): Map<string, string> {
  const headers = new Map<string, string>()
  for (const rule of rules) {
    if (!pathMatches(rule.path, path)) continue
    for (const name of rule.detach) headers.delete(name)
    for (const [name, value] of rule.headers) {
      const before = headers.get(name)
      headers.set(name, before === undefined ? value : `${before}, ${value}`)
    }
  }
  return headers
}

export type Resolved
  = | { kind: 'file', file: string, status: 200 | 404 }
    | { kind: 'redirect', location: string }

// Which file answers a path, with `drop-trailing-slash`: `/about` is served
// from `about/index.html` (or `about.html`), `/about/` redirects to `/about`,
// and a path with no file gets `404.html` with status 404. `exists` says
// whether a file (not a folder) is in the built site, as a path relative to
// its root with no leading slash.
export function resolveAsset(path: string, exists: (file: string) => boolean): Resolved {
  if (path !== '/' && path.endsWith('/')) {
    const trimmed = path.replace(/\/+$/, '') || '/'
    const page = trimmed === '/' ? 'index.html' : `${trimmed.slice(1)}/index.html`
    if (exists(page) || exists(`${trimmed.slice(1)}.html`)) return { kind: 'redirect', location: trimmed }
  }
  const relative = path.replace(/^\/+/, '')
  const candidates = relative === ''
    ? ['index.html']
    : extname(relative) ? [relative] : [`${relative}.html`, `${relative}/index.html`, relative]
  for (const file of candidates) if (exists(file)) return { kind: 'file', file, status: 200 }
  return { kind: 'file', file: '404.html', status: 404 }
}

const types: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.pdf': 'application/pdf',
  '.webmanifest': 'application/manifest+json',
}

export function contentType(file: string): string {
  return types[extname(file).toLowerCase()] ?? 'application/octet-stream'
}

// Cloudflare compresses text types. Fonts, images and PDFs go as they are.
export function isCompressible(type: string): boolean {
  return /^text\/|^application\/(?:json|xml|manifest\+json)|^image\/svg\+xml/.test(type)
}
