// The `_headers` file and its Content Security Policy (lib/headers.ts, D-025).
import { describe, expect, it } from 'vitest'
import { beaconReportOrigin, beaconScriptOrigin, contentSecurityPolicy, headerRules, headersFile, inlineScripts, maxHeaderLine, pageScriptHashes, scriptHash } from '../../lib/headers'
import { beaconUrl } from '../../app/utils/analytics'

describe('inlineScripts', () => {
  it('finds the inline scripts the browser runs', () => {
    const html = [
      '<script>a()</script>',
      '<script type="module">b()</script>',
      '<script type=importmap>{"imports":{}}</script>',
      '<SCRIPT TYPE="text/javascript">c()</SCRIPT>',
      '<script data-x=\'1\'>d()</script >',
    ].join('')
    expect(inlineScripts(html)).toEqual(['a()', 'b()', '{"imports":{}}', 'c()', 'd()'])
  })

  it('skips scripts with a src, JSON data and JSON-LD', () => {
    const html = [
      '<script type="module" src="/_nuxt/entry.js" crossorigin></script>',
      '<script type="application/json" id="__NUXT_DATA__">[1]</script>',
      '<script type="application/ld+json">{"@context":"https://schema.org"}</script>',
      '<script data-src="/x" type="application/json">[]</script>',
    ].join('')
    expect(inlineScripts(html)).toEqual([])
  })

  it('keeps the text exactly, line breaks included', () => {
    expect(inlineScripts('<script>\n  a()\n</script>')).toEqual(['\n  a()\n'])
  })
})

describe('scriptHash', () => {
  it('is the base64 SHA-256 of the script text, as CSP wants it', () => {
    // SHA-256 of the empty string.
    expect(scriptHash('')).toBe(`'sha256-47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU='`)
    expect(scriptHash('a()')).not.toBe(scriptHash('a() '))
  })
})

describe('pageScriptHashes', () => {
  it('lists each hash once, sorted, across pages', () => {
    const hashes = pageScriptHashes(['<script>a()</script><script>b()</script>', '<script>a()</script>'])
    expect(hashes).toEqual([scriptHash('a()'), scriptHash('b()')].sort())
  })
})

describe('contentSecurityPolicy', () => {
  const policy = contentSecurityPolicy([scriptHash('a()')])
  const directive = (name: string) => policy.split('; ').find(part => part.startsWith(`${name} `))

  it('allows scripts from this site, the listed hashes and the beacon only', () => {
    expect(directive('script-src')).toBe(`script-src 'self' ${scriptHash('a()')} ${beaconScriptOrigin}`)
    expect(policy).not.toContain('unsafe-eval')
  })

  it('allows the beacon reports and this site\'s own requests', () => {
    expect(directive('connect-src')).toBe(`connect-src 'self' ${beaconReportOrigin}`)
  })

  it('blocks plugins, framing and other base URLs', () => {
    expect(directive('object-src')).toBe(`object-src 'none'`)
    expect(directive('frame-ancestors')).toBe(`frame-ancestors 'none'`)
    expect(directive('base-uri')).toBe(`base-uri 'self'`)
    expect(directive('default-src')).toBe(`default-src 'self'`)
    expect(directive('worker-src')).toBe(`worker-src 'self'`)
  })

  it('allows the beacon script the analytics hook adds', () => {
    expect(beaconUrl.startsWith(`${beaconScriptOrigin}/`)).toBe(true)
  })
})

describe('headersFile', () => {
  const text = headersFile([scriptHash('a()')])
  const lines = text.split('\n')

  it('sets every security header on all paths', () => {
    const all = lines.slice(lines.indexOf('/*') + 1, lines.indexOf('/_nuxt/*'))
    expect(all.map(line => line.split(':')[0]!.trim())).toEqual([
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'X-Frame-Options',
      'Content-Security-Policy',
      'Cache-Control',
    ])
    expect(all).toContain('  X-Frame-Options: DENY')
    expect(all).toContain('  Cache-Control: public, max-age=0, must-revalidate')
  })

  it('drops the short cache before it sets the long one, so Workers never joins the two', () => {
    const start = lines.indexOf('/_nuxt/*')
    expect(lines.slice(start, start + 3)).toEqual(['/_nuxt/*', '  ! Cache-Control', '  Cache-Control: public, max-age=31536000, immutable'])
    const sw = lines.indexOf('/_nuxt-skew-sw.js')
    expect(lines.slice(sw, sw + 3)).toEqual(['/_nuxt-skew-sw.js', '  ! Cache-Control', '  Cache-Control: no-cache'])
  })

  it('sets every header only once per rule', () => {
    for (const rule of headerRules([])) {
      const names = Object.keys(rule.headers).map(name => name.toLowerCase())
      expect(new Set(names).size).toBe(names.length)
    }
  })

  it('keeps the contact file out of search', () => {
    const at = lines.indexOf('/contact-details.json')
    expect(lines[at + 1]).toBe('  X-Robots-Tag: noindex')
  })

  it('ends with a line break, so a module that appends rules starts on a new line', () => {
    expect(text.endsWith('\n')).toBe(true)
  })

  it('throws when the policy line is longer than Workers reads', () => {
    const many = Array.from({ length: 40 }, (_, i) => scriptHash(`s${i}()`))
    expect(() => headersFile(many)).toThrow(`more than the ${maxHeaderLine}`)
  })
})
