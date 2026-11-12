// The Workers static-assets rules that scripts/serve-built.ts follows for the
// quality checks (lib/workers-assets.ts).
import { describe, expect, it } from 'vitest'
import { contentType, headersFor, isCompressible, pathMatches, readHeaderRules, resolveAsset } from '../../lib/workers-assets'

const headersText = `# Written at build time.
/*
  X-Frame-Options: DENY
  Cache-Control: public, max-age=0, must-revalidate
/_nuxt/*
  ! Cache-Control
  Cache-Control: public, max-age=31536000, immutable
/404
  X-Robots-Tag: noindex

/*.md
  Link: </llms.txt>; rel="describedby"
`

describe('readHeaderRules', () => {
  it('reads paths, headers and detached headers in file order', () => {
    expect(readHeaderRules(headersText)).toEqual([
      { path: '/*', headers: [['x-frame-options', 'DENY'], ['cache-control', 'public, max-age=0, must-revalidate']], detach: [] },
      { path: '/_nuxt/*', headers: [['cache-control', 'public, max-age=31536000, immutable']], detach: ['cache-control'] },
      { path: '/404', headers: [['x-robots-tag', 'noindex']], detach: [] },
      { path: '/*.md', headers: [['link', '</llms.txt>; rel="describedby"']], detach: [] },
    ])
  })

  it('stops on a line it cannot read', () => {
    expect(() => readHeaderRules('  X-Frame-Options: DENY')).toThrow('before any path')
    expect(() => readHeaderRules('/*\n  no colon here')).toThrow('Not a header line')
  })
})

describe('pathMatches', () => {
  it('matches the whole path, with * for any run of characters', () => {
    expect(pathMatches('/*', '/')).toBe(true)
    expect(pathMatches('/*', '/work/a')).toBe(true)
    expect(pathMatches('/_nuxt/*', '/_nuxt/a.js')).toBe(true)
    expect(pathMatches('/_nuxt/*', '/about')).toBe(false)
    expect(pathMatches('/404', '/404')).toBe(true)
    expect(pathMatches('/404', '/4040')).toBe(false)
    expect(pathMatches('/*.md', '/about.md')).toBe(true)
    expect(pathMatches('/*.md', '/aboutxmd')).toBe(false)
  })
})

describe('headersFor', () => {
  const rules = readHeaderRules(headersText)

  it('applies every matching rule, and a detach drops what a broader rule set', () => {
    expect(Object.fromEntries(headersFor(rules, '/about'))).toEqual({
      'x-frame-options': 'DENY',
      'cache-control': 'public, max-age=0, must-revalidate',
    })
    expect(headersFor(rules, '/_nuxt/a.js').get('cache-control')).toBe('public, max-age=31536000, immutable')
    expect(headersFor(rules, '/404').get('x-robots-tag')).toBe('noindex')
  })

  it('joins two values of one header with a comma, as Workers does', () => {
    const twice = readHeaderRules('/*\n  Vary: Accept\n/a\n  Vary: Origin\n')
    expect(headersFor(twice, '/a').get('vary')).toBe('Accept, Origin')
  })
})

describe('resolveAsset', () => {
  const files = new Set(['index.html', '404.html', 'about/index.html', 'work/index.html', 'work/a/index.html', 'robots.txt', '_nuxt/a.js', 'old.html'])
  const exists = (file: string) => files.has(file)

  it('serves a page from its folder, with no trailing slash', () => {
    expect(resolveAsset('/', exists)).toEqual({ kind: 'file', file: 'index.html', status: 200 })
    expect(resolveAsset('/about', exists)).toEqual({ kind: 'file', file: 'about/index.html', status: 200 })
    expect(resolveAsset('/work/a', exists)).toEqual({ kind: 'file', file: 'work/a/index.html', status: 200 })
    expect(resolveAsset('/old', exists)).toEqual({ kind: 'file', file: 'old.html', status: 200 })
  })

  it('redirects a page path with a trailing slash to the path without it', () => {
    expect(resolveAsset('/about/', exists)).toEqual({ kind: 'redirect', location: '/about' })
    expect(resolveAsset('/work/a/', exists)).toEqual({ kind: 'redirect', location: '/work/a' })
  })

  it('serves files as they are, and 404.html with status 404 for anything else', () => {
    expect(resolveAsset('/robots.txt', exists)).toEqual({ kind: 'file', file: 'robots.txt', status: 200 })
    expect(resolveAsset('/_nuxt/a.js', exists)).toEqual({ kind: 'file', file: '_nuxt/a.js', status: 200 })
    expect(resolveAsset('/no-such-page', exists)).toEqual({ kind: 'file', file: '404.html', status: 404 })
    expect(resolveAsset('/no-such-page/', exists)).toEqual({ kind: 'file', file: '404.html', status: 404 })
    expect(resolveAsset('/_nuxt/missing.js', exists)).toEqual({ kind: 'file', file: '404.html', status: 404 })
  })

  it('serves 404.html with status 200 at /404, as Workers does', () => {
    expect(resolveAsset('/404', exists)).toEqual({ kind: 'file', file: '404.html', status: 200 })
  })
})

describe('contentType and isCompressible', () => {
  it('names the type of the built files and compresses only text', () => {
    expect(contentType('index.html')).toBe('text/html; charset=utf-8')
    expect(contentType('_nuxt/a.js')).toBe('text/javascript; charset=utf-8')
    expect(contentType('_fonts/a.woff2')).toBe('font/woff2')
    expect(contentType('_og/s/a.png')).toBe('image/png')
    expect(contentType('_headers')).toBe('application/octet-stream')
    for (const type of ['text/html; charset=utf-8', 'text/javascript; charset=utf-8', 'application/json; charset=utf-8', 'image/svg+xml']) expect(isCompressible(type), type).toBe(true)
    for (const type of ['font/woff2', 'image/png', 'application/pdf']) expect(isCompressible(type), type).toBe(false)
  })
})
