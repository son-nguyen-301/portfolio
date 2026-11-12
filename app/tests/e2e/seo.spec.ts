// Search tags over the generated site (PF-020, D-036): every page has a title,
// a description and their Open Graph copies, every public page has its own
// canonical link and is in the sitemap, and the schema.org graph names Son as
// a Person and each case study as a CreativeWork. Run `pnpm generate` first.
import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { parse } from 'yaml'

const root = fileURLToPath(new URL('../..', import.meta.url))
const built = join(root, '.output/public')
const siteUrl = 'https://me.haisonnguyen.dev'
const siteName = 'Hai Son Nguyen'
const maxDescription = 160

const profile = parse(readFileSync(join(root, 'content/profile.yml'), 'utf8')) as {
  name: string
  title: string
  links: { linkedin: string, github: string, upwork: string }
}

// The case studies, by page path, with their front matter titles.
const studies = readdirSync(join(root, 'content/work')).filter(file => file.endsWith('.md')).map((file) => {
  const front = readFileSync(join(root, 'content/work', file), 'utf8').split(/^---$/m)[1] ?? ''
  return { path: `/work/${file.replace(/\.md$/, '')}`, title: (parse(front) as { title: string }).title }
})

function htmlFiles(prefix = ''): string[] {
  return readdirSync(join(built, prefix), { withFileTypes: true }).flatMap((item) => {
    const rel = prefix ? `${prefix}/${item.name}` : item.name
    if (item.isDirectory()) return htmlFiles(rel)
    return rel.endsWith('.html') ? [rel] : []
  })
}

// "about/index.html" is "/about", "index.html" is "/".
function pagePath(file: string): string {
  return `/${file.replace(/(^|\/)index\.html$/, '')}`
}

function decode(text: string): string {
  return text
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replaceAll('&quot;', '"').replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&amp;', '&')
}

function page(file: string): string {
  return readFileSync(join(built, file), 'utf8')
}

// The head only: the diagrams' SVG <title> elements are in the body.
function head(file: string): string {
  const html = page(file)
  return html.slice(0, html.indexOf('</head>'))
}

function metaContents(html: string, attr: 'name' | 'property', key: string): string[] {
  const tags = html.match(/<meta\b[^>]*>/g) ?? []
  return tags
    .filter(tag => tag.includes(`${attr}="${key}"`))
    .map(tag => decode(/content="([^"]*)"/.exec(tag)?.[1] ?? ''))
}

function canonicals(html: string): string[] {
  return [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*>/g)].map(([tag]) => /href="([^"]*)"/.exec(tag)?.[1] ?? '')
}

// The schema.org graph, which the module writes at the end of the body.
interface Node { '@id'?: string, '@type'?: string | string[], [key: string]: unknown }

function graph(html: string): Node[] {
  const json = /<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/.exec(html)?.[1]
  return json ? (JSON.parse(json) as { '@graph': Node[] })['@graph'] : []
}

const all = htmlFiles()
// 200.html is the app's empty fallback shell: Workers never serves it for a
// missing path (`not_found_handling: "404-page"` in wrangler.jsonc), and
// _headers sends it with `X-Robots-Tag: noindex`. It is not a page.
const pages = all.filter(file => file !== '200.html')
// Every page but the 404 page is public.
const publicPages = pages.filter(file => file !== '404.html')

test('the build has every page', () => {
  expect(all).toContain('200.html')
  expect(pages).toContain('404.html')
  expect(publicPages.map(pagePath)).toEqual(expect.arrayContaining(['/', '/work', '/services', '/lab', '/about', '/cv', '/contact', ...studies.map(study => study.path)]))
  expect(readFileSync(join(built, '_headers'), 'utf8')).toMatch(/^\/200\n {2}X-Robots-Tag: noindex$/m)
})

test('every page has a title, a description and their Open Graph copies', () => {
  const problems = pages.flatMap((file) => {
    const html = head(file)
    const titles = [...html.matchAll(/<title>([^<]*)<\/title>/g)].map(([, text]) => decode(text ?? ''))
    const descriptions = metaContents(html, 'name', 'description')
    const ogTitles = metaContents(html, 'property', 'og:title')
    const ogDescriptions = metaContents(html, 'property', 'og:description')
    const found: string[] = []
    if (titles.length !== 1 || !titles[0]?.endsWith(` | ${siteName}`)) found.push(`title ${JSON.stringify(titles)}`)
    if (descriptions.length !== 1 || !descriptions[0]) found.push(`description ${JSON.stringify(descriptions)}`)
    else if (descriptions[0].length > maxDescription) found.push(`description is ${descriptions[0].length} characters`)
    if (ogTitles.length !== 1 || ogTitles[0] !== titles[0]) found.push(`og:title ${JSON.stringify(ogTitles)}`)
    if (ogDescriptions.length !== 1 || ogDescriptions[0] !== descriptions[0]) found.push(`og:description ${JSON.stringify(ogDescriptions)}`)
    return found.map(problem => `${file}: ${problem}`)
  })
  expect(problems).toEqual([])
})

test('every public page has its own canonical link and may be indexed', () => {
  const problems = publicPages.flatMap((file) => {
    const html = head(file)
    const found: string[] = []
    const links = canonicals(html)
    const own = pagePath(file) === '/' ? `${siteUrl}/` : `${siteUrl}${pagePath(file)}`
    if (links.length !== 1 || links[0] !== own) found.push(`canonical ${JSON.stringify(links)}, not ${own}`)
    if (metaContents(html, 'name', 'robots').some(value => value.includes('noindex'))) found.push('robots noindex')
    return found.map(problem => `${file}: ${problem}`)
  })
  expect(problems).toEqual([])
})

test('the 404 page is noindex and has no canonical link', () => {
  const html = head('404.html')
  expect(html).toContain(`<title>Page not found | ${siteName}</title>`)
  expect(metaContents(html, 'name', 'robots').every(value => value.includes('noindex'))).toBe(true)
  expect(canonicals(html)).toEqual([])
})

test('the sitemap lists every public page and nothing else', () => {
  const xml = readFileSync(join(built, 'sitemap.xml'), 'utf8')
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, loc]) => loc).sort()
  const expected = publicPages.map(file => (pagePath(file) === '/' ? `${siteUrl}/` : `${siteUrl}${pagePath(file)}`)).sort()
  expect(locs).toEqual(expected)
})

test('robots.txt lets every crawler in and links the sitemap', () => {
  const robots = readFileSync(join(built, 'robots.txt'), 'utf8')
  expect(robots).toMatch(/^User-agent: \*$/m)
  expect(robots).not.toMatch(/^Disallow: \S/m)
  expect(robots).toContain(`Sitemap: ${siteUrl}/sitemap.xml`)
})

test('every public page names Son as a Person and the site as a WebSite', () => {
  const identity = `${siteUrl}/#identity`
  for (const file of publicPages) {
    const nodes = graph(page(file))
    const person = nodes.find(node => node['@id'] === identity)
    expect(person, file).toMatchObject({
      '@type': 'Person',
      'name': profile.name,
      'jobTitle': profile.title,
      'sameAs': [profile.links.linkedin, profile.links.github, profile.links.upwork],
    })
    const website = nodes.find(node => node['@type'] === 'WebSite')
    expect(website, file).toMatchObject({ name: siteName, url: `${siteUrl}/`, publisher: { '@id': identity } })
  }
})

test('every case study page has a CreativeWork by Son', () => {
  expect(studies.length).toBeGreaterThan(0)
  for (const study of studies) {
    const nodes = graph(page(`${study.path.slice(1)}/index.html`))
    const work = nodes.filter(node => node['@type'] === 'CreativeWork')
    expect(work, study.path).toHaveLength(1)
    expect(work[0], study.path).toMatchObject({
      '@id': `${siteUrl}${study.path}#creativework`,
      'name': study.title,
      'url': `${siteUrl}${study.path}`,
      'author': { '@id': `${siteUrl}/#identity` },
      'mainEntityOfPage': { '@id': `${siteUrl}${study.path}#webpage` },
    })
    expect(nodes.some(node => node['@id'] === `${siteUrl}${study.path}#webpage`), study.path).toBe(true)
  }
  const others = publicPages.filter(file => !studies.some(study => `${study.path.slice(1)}/index.html` === file))
  for (const file of others) expect(graph(page(file)).some(node => node['@type'] === 'CreativeWork'), file).toBe(false)
})
