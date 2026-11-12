// The link checker's rules (lib/links.ts, PF-024). tests/e2e/links.spec.ts runs
// them over the built site.
import { describe, expect, it } from 'vitest'
import { checkLink, fileKind, findIds, findLinks, servedPath, type LinkContext } from '../../lib/links'

const files = new Set(['index.html', 'about/index.html', 'about.md', 'contact/index.html', '404.html', '_nuxt/app.css', '_fonts/inter.woff2', 'sitemap.xml'])
const pageIds: Record<string, string[]> = {
  'index.html': ['main'],
  'about/index.html': ['main', 'earlier'],
}
const context: LinkContext = {
  site: 'https://example.com',
  exists: file => files.has(file),
  ids: file => new Set(pageIds[file] ?? []),
}
const check = (link: string, from = 'index.html') => checkLink(link, from, context)

describe('fileKind', () => {
  it('reads pages, stylesheets, Markdown, the sitemap and text files only', () => {
    expect(['a/index.html', 'a.css', 'a.md', 'sitemap.xml', 'robots.txt', 'a.js', 'a.json', 'a.png'].map(fileKind))
      .toEqual(['html', 'css', 'markdown', 'xml', 'text', undefined, undefined, undefined])
  })
})

describe('findLinks', () => {
  it('finds href, src, srcset and the preview image tags in HTML', () => {
    const html = `<a href="/about">About</a><img src='/a.png' srcset="/a.png 1x, /b.png 2x">
      <link rel=stylesheet href=/_nuxt/app.css><meta property="og:image" content="https://example.com/og.png">
      <meta name="twitter:image" content="https://example.com/tw.png"><meta name="description" content="Not a link">
      <a href="/x?a=1&amp;b=2">x</a>`
    expect(findLinks(html, 'html')).toEqual(['/about', '/a.png', '/b.png', '/_nuxt/app.css', 'https://example.com/og.png', 'https://example.com/tw.png', '/x?a=1&b=2'])
  })

  it('skips code in inline scripts and comments, but reads inline styles', () => {
    const html = `<script src="/s.js">const a = '<a href="/in-script">'</script><!-- <a href="/in-comment"> -->
      <style>body { background: url("/bg.png") }</style><div style="background:url('/div.png')"></div>`
    expect(findLinks(html, 'html')).toEqual(['/s.js', '/bg.png', '/div.png'])
  })

  it('reads SVG xlink:href and the URLs in the schema.org graph, but not its ids', () => {
    const html = `<svg><use xlink:href="/icons.svg#x"></use></svg>
      <script type="application/ld+json">{"@id":"https://example.com/#identity","url":"http:\\/\\/example.com\\/","sameAs":["https://github.com/someone"]}</script>`
    expect(findLinks(html, 'html')).toEqual(['/icons.svg#x', 'http://example.com/', 'https://github.com/someone'])
  })

  it('finds url() in stylesheets', () => {
    expect(findLinks('@font-face{src:url(/_fonts/a.woff2) format("woff2"),url("/b.woff")}a{b:url( \'/c.png\' )}', 'css'))
      .toEqual(['/_fonts/a.woff2', '/b.woff', '/c.png'])
  })

  it('finds Markdown links and bare URLs, without the end of the sentence', () => {
    const md = 'See [Work](https://example.com/work "Work") and https://example.com/lab. Or <https://example.com/cv>.'
    expect(findLinks(md, 'markdown')).toEqual(['https://example.com/work', 'https://example.com/lab', 'https://example.com/cv'])
  })

  it('keeps one level of brackets in a URL', () => {
    expect(findLinks('[a](https://example.com/a_(b)) and https://example.com/c_(d).', 'markdown'))
      .toEqual(['https://example.com/a_(b)', 'https://example.com/c_(d)'])
  })

  it('skips schema.org ids, which are names and not links', () => {
    const md = '{"@id":"https://example.com/#identity","url":"https://example.com/"}'
    expect(findLinks(md, 'markdown')).toEqual(['https://example.com/'])
  })

  it('finds the sitemap pages and its stylesheet', () => {
    const xml = '<?xml-stylesheet type="text/xsl" href="/__sitemap__/style.xsl"?><urlset><url><loc>https://example.com/about</loc></url></urlset>'
    expect(findLinks(xml, 'xml')).toEqual(['https://example.com/about', '/__sitemap__/style.xsl'])
  })
})

describe('findIds', () => {
  it('finds ids and the names of anchors', () => {
    expect([...findIds('<main id="main"><h2 id=\'earlier\'>x</h2><a name="old"></a><input name="q"></main>')]).toEqual(['main', 'earlier', 'old'])
  })

  it('skips ids inside inline scripts and comments', () => {
    expect([...findIds('<script>const a = \'<p id="in-script">\'</script><!-- <p id="in-comment"> --><p id="real">')]).toEqual(['real'])
  })
})

describe('servedPath', () => {
  it('serves pages without a trailing slash and other files at their own path', () => {
    expect(['index.html', 'about/index.html', 'about.md', '404.html', '_nuxt/app.css'].map(servedPath))
      .toEqual(['/', '/about', '/about.md', '/404.html', '/_nuxt/app.css'])
  })
})

describe('checkLink', () => {
  it('passes internal links that Workers answers with a file', () => {
    for (const link of ['/', '/about', '/about.md', 'about', '/_nuxt/app.css', '/about?from=upwork', 'https://example.com/about']) {
      expect(check(link), link).toBeUndefined()
    }
  })

  it('resolves a relative link from the page it is on', () => {
    expect(check('../_fonts/inter.woff2', '_nuxt/app.css')).toBeUndefined()
    expect(check('contact', 'about/index.html')).toBeUndefined()
  })

  it('fails a link with no file, or one that only works through a redirect', () => {
    expect(check('/no-such-page')).toBe('not found')
    expect(check('https://example.com/missing.png')).toBe('not found')
    expect(check('/about/')).toBe('redirects to /about')
  })

  it('checks that a #part names an element on the target page', () => {
    expect(check('/about#earlier')).toBeUndefined()
    expect(check('#main')).toBeUndefined()
    expect(check('/about#later')).toBe('no element with id "later" on /about')
    expect(check('/_fonts/inter.woff2#iefix')).toBeUndefined()
    expect(check('/about#%E0%A4%A')).toBe('not a valid URL')
  })

  it('needs https for every link that leaves the site, and for the site itself', () => {
    expect(check('https://github.com/someone')).toBeUndefined()
    expect(check('http://github.com/someone')).toBe('external link is not https')
    expect(check('http://example.com/about')).toBe('link to this site is not https')
    expect(check('//github.com/someone')).toBe('protocol-relative link: write https:')
  })

  it('leaves mail, phone and data links alone and fails other schemes', () => {
    for (const link of ['mailto:someone@example.com', 'tel:+100', 'data:image/png;base64,AAAA']) expect(check(link), link).toBeUndefined()
    expect(check('javascript:void(0)')).toBe('unknown scheme javascript:')
    expect(check('')).toBe('empty link')
  })
})
