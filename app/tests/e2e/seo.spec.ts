// Search tags over the generated site (PF-020, D-036): every page has a title,
// a description and their Open Graph copies, every public page has its own
// canonical link and is in the sitemap, and the schema.org graph names Son as
// a Person and each case study as a CreativeWork. Every page also has its own
// link preview image, a 1200 x 630 PNG in the build (PF-021, D-037). Run
// `pnpm generate` first.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
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

// The width and height in a PNG's header, or undefined for any other file.
function pngSize(file: string): { width: number, height: number } | undefined {
  const bytes = readFileSync(file)
  const signature = '89504e470d0a1a0a'
  if (bytes.subarray(0, 8).toString('hex') !== signature || bytes.subarray(12, 16).toString('latin1') !== 'IHDR') return undefined
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) }
}

test('every page has its own link preview image: a 1200 x 630 PNG in the build', () => {
  const images = new Map<string, string>()
  const problems = pages.flatMap((file) => {
    const html = head(file)
    const found: string[] = []
    const urls = metaContents(html, 'property', 'og:image')
    const url = urls[0] ?? ''
    if (urls.length !== 1 || !url.startsWith(`${siteUrl}/_og/s/`) || !url.endsWith('.png')) {
      return [`${file}: og:image ${JSON.stringify(urls)}`]
    }
    if (JSON.stringify(metaContents(html, 'name', 'twitter:image')) !== JSON.stringify([url])) found.push('twitter:image is not the og:image')
    if (metaContents(html, 'property', 'og:image:width').join() !== '1200') found.push('og:image:width is not 1200')
    if (metaContents(html, 'property', 'og:image:height').join() !== '630') found.push('og:image:height is not 630')
    const alts = metaContents(html, 'property', 'og:image:alt')
    if (alts.length !== 1 || !alts[0]?.endsWith(profile.name)) found.push(`og:image:alt ${JSON.stringify(alts)}`)
    else if (JSON.stringify(metaContents(html, 'name', 'twitter:image:alt')) !== JSON.stringify(alts)) found.push('twitter:image:alt is not the og:image:alt')
    const path = join(built, url.slice(siteUrl.length))
    const size = existsSync(path) ? pngSize(path) : undefined
    if (!size) found.push(`${url} is not a PNG in the build`)
    else if (size.width !== 1200 || size.height !== 630) found.push(`${url} is ${size.width} x ${size.height}`)
    const other = images.get(url)
    if (other) found.push(`same image as ${other}`)
    images.set(url, file)
    return found.map(problem => `${file}: ${problem}`)
  })
  expect(problems).toEqual([])
  expect(images.size).toBe(pages.length)
})

test('the image tags follow the page on client-side navigation', async ({ page }) => {
  await page.goto('/')
  // Wait until the app has hydrated, so the click is a client-side navigation.
  await page.waitForFunction(() => Boolean((document.querySelector('#__nuxt') as { __vue_app__?: unknown } | null)?.__vue_app__))
  await page.evaluate(() => {
    (window as { sameVisit?: boolean }).sameVisit = true
  })
  await page.locator('header a[href="/work"]').first().click()
  await expect(page).toHaveURL(/\/work$/)
  // The same image file as the built page. In the browser the module joins
  // the path to the page's own origin, which here is the test server.
  const built = head('work/index.html')
  const image = new URL(metaContents(built, 'property', 'og:image')[0]!).pathname
  await expect.poll(async () => new URL(await page.locator('meta[property="og:image"]').getAttribute('content') ?? '', page.url()).pathname).toBe(image)
  await expect(page.locator('meta[property="og:image:alt"]')).toHaveAttribute('content', metaContents(built, 'property', 'og:image:alt')[0]!)
  // No full page load happened.
  expect(await page.evaluate(() => (window as { sameVisit?: boolean }).sameVisit)).toBe(true)
})

test('the build ships no fallback fonts for the image renderer', () => {
  expect(existsSync(join(built, '_og-static-fonts'))).toBe(false)
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
