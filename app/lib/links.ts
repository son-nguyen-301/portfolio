// The link checker (PF-024): every internal link and asset in the built site
// resolves, and every external link is https. tests/e2e/links.spec.ts runs it
// over .output/public after `pnpm generate`.
//
// An internal link is one with no host, or with the site's own host (the
// Markdown copies, the sitemap and the preview image tags use full URLs). It
// resolves the way Workers serves the site (lib/workers-assets.ts): it must
// answer with a file and status 200, not a redirect and not the 404 page. A
// `#part` must name an element on the target page.
import { extname } from 'node:path'
import { resolveAsset } from './workers-assets'

export type FileKind = 'html' | 'css' | 'markdown' | 'xml' | 'text'

const kinds: Record<string, FileKind> = {
  '.html': 'html',
  '.css': 'css',
  '.md': 'markdown',
  '.xml': 'xml',
  '.txt': 'text',
}

// The files the checker reads. Scripts, data and images hold no links to check.
export function fileKind(file: string): FileKind | undefined {
  return kinds[extname(file).toLowerCase()]
}

function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
}

// An attribute's value, quoted or not.
const attribute = (name: string) => new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'gi')

function attributeValues(tag: string, name: string): string[] {
  return [...tag.matchAll(attribute(name))].map(match => decodeEntities(match[1] ?? match[2] ?? match[3] ?? ''))
}

// The meta tags whose `content` is a link: the preview image and page URL.
const linkMeta = /^(?:og:image(?::secure_url)?|og:url|twitter:image)$/i

// Inline scripts and styles are code, not markup, and comments are not shown:
// keep only the script and style tags themselves.
function markupOnly(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/(<script\b[^>]*>)[\s\S]*?<\/script>/gi, '$1</script>')
    .replace(/(<style\b[^>]*>)[\s\S]*?<\/style>/gi, '$1</style>')
}

function htmlLinks(html: string): string[] {
  const markup = markupOnly(html)
  const links: string[] = []
  for (const [tag] of markup.matchAll(/<[a-z][^>]*>/gi)) {
    for (const name of ['href', 'src', 'poster', 'action']) links.push(...attributeValues(tag, name))
    for (const name of ['srcset', 'imagesrcset']) {
      for (const set of attributeValues(tag, name)) {
        links.push(...set.split(',').map(item => item.trim().split(/\s+/)[0]!).filter(Boolean))
      }
    }
    if (/^<meta\b/i.test(tag)) {
      const names = [...attributeValues(tag, 'property'), ...attributeValues(tag, 'name')]
      if (names.some(name => linkMeta.test(name))) links.push(...attributeValues(tag, 'content'))
    }
  }
  // Inline styles can point at assets too.
  for (const [, body] of html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) links.push(...cssLinks(body!))
  for (const style of [...markup.matchAll(attribute('style'))]) links.push(...cssLinks(decodeEntities(style[1] ?? style[2] ?? style[3] ?? '')))
  return links
}

function cssLinks(css: string): string[] {
  return [...css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s]*))\s*\)/gi)].map(match => match[1] ?? match[2] ?? match[3] ?? '')
}

// Markdown links and bare URLs. A bare URL loses the punctuation that ends
// its sentence. The Markdown copies carry the schema.org graph, whose `@id`
// values are names (`https://me.haisonnguyen.dev/#identity`), not links.
function textLinks(text: string): string[] {
  const links = [...text.matchAll(/\]\(\s*<?([^)\s>]+)>?(?:\s+"[^"]*")?\s*\)/g)].map(match => match[1]!)
  const prose = text.replace(/"@id"\s*:\s*"[^"]*"/g, '')
  for (const [url] of prose.matchAll(/\bhttps?:\/\/[^\s<>"'`)\]]+/gi)) links.push(url.replace(/[.,;:!?*_]+$/, ''))
  return links
}

function xmlLinks(xml: string): string[] {
  const links = [...xml.matchAll(/<loc>\s*([^<]*?)\s*<\/loc>/g)].map(match => decodeEntities(match[1]!))
  links.push(...[...xml.matchAll(attribute('href'))].map(match => decodeEntities(match[1] ?? match[2] ?? match[3] ?? '')))
  return links
}

// Every link in a file, as written, once each.
export function findLinks(text: string, kind: FileKind): string[] {
  const found = kind === 'html'
    ? htmlLinks(text)
    : kind === 'css'
      ? cssLinks(text)
      : kind === 'xml' ? xmlLinks(text) : textLinks(text)
  return [...new Set(found.map(link => link.trim()))]
}

// The ids a page's elements carry (and old-style `<a name>`), for `#part` links.
export function findIds(html: string): Set<string> {
  const ids = new Set<string>()
  for (const [tag] of markupOnly(html).matchAll(/<[a-z][^>]*>/gi)) {
    for (const id of attributeValues(tag, 'id')) ids.add(id)
    if (/^<a\b/i.test(tag)) for (const name of attributeValues(tag, 'name')) ids.add(name)
  }
  return ids
}

// The path a built file is served at: `work/index.html` is `/work`
// (`drop-trailing-slash`), `about.md` is `/about.md`.
export function servedPath(file: string): string {
  if (file === 'index.html') return '/'
  if (file.endsWith('/index.html')) return `/${file.slice(0, -'/index.html'.length)}`
  return `/${file}`
}

export interface LinkContext {
  // The site's origin, for example `https://me.haisonnguyen.dev`.
  site: string
  // Whether a file is in the built site (a path relative to its root).
  exists: (file: string) => boolean
  // The ids of a built HTML file.
  ids: (file: string) => Set<string>
}

// Schemes that point nowhere on the web, so there is nothing to resolve.
const ignored = new Set(['mailto:', 'tel:', 'data:', 'blob:'])

// What is wrong with one link in a built file, or undefined when it is fine.
export function checkLink(link: string, from: string, context: LinkContext): string | undefined {
  if (link === '') return 'empty link'
  if (link.startsWith('//')) return 'protocol-relative link: write https:'
  const scheme = /^([a-z][a-z0-9+.-]*:)/i.exec(link)?.[1]?.toLowerCase()
  const site = new URL(context.site)
  if (scheme && ignored.has(scheme)) return undefined
  if (scheme && scheme !== 'http:' && scheme !== 'https:') return `unknown scheme ${scheme}`

  let url: URL
  try {
    url = new URL(link, new URL(servedPath(from), site))
  }
  catch {
    return 'not a valid URL'
  }
  if (url.host !== site.host) return url.protocol === 'https:' ? undefined : 'external link is not https'
  if (url.protocol !== 'https:') return 'link to this site is not https'

  let path: string
  try {
    path = decodeURIComponent(url.pathname)
  }
  catch {
    return 'not a valid URL'
  }
  const resolved = resolveAsset(path, context.exists)
  if (resolved.kind === 'redirect') return `redirects to ${resolved.location}`
  if (resolved.status === 404) return 'not found'
  let part: string
  try {
    part = decodeURIComponent(url.hash.slice(1))
  }
  catch {
    return 'not a valid URL'
  }
  if (part && resolved.file.endsWith('.html') && !context.ids(resolved.file).has(part)) {
    return `no element with id "${part}" on ${servedPath(resolved.file)}`
  }
  return undefined
}
