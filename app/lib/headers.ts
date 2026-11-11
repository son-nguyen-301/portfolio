// The `_headers` file for Cloudflare Workers static assets
// (docs/architecture.md, Headers). modules/headers.ts writes it into the built
// site after every page is prerendered, because the Content Security Policy
// lists a hash of every inline script, and those scripts change with each
// build (Nuxt's config script holds the build ID).
//
// Workers joins the values with a comma when two rules set the same header on
// one path, so each header is set by one rule only, or detached with "! ".
import { createHash } from 'node:crypto'

// The Cloudflare Web Analytics beacon: its script, and where it sends page
// views (https://developers.cloudflare.com/web-analytics/faq/).
export const beaconScriptOrigin = 'https://static.cloudflareinsights.com'
export const beaconReportOrigin = 'https://cloudflareinsights.com'

// Workers reads at most 2,000 characters on a line of `_headers`.
export const maxHeaderLine = 2000

// Script types the browser runs, and so the policy covers. JSON data and
// JSON-LD are not run.
const runnableTypes = new Set(['', 'text/javascript', 'application/javascript', 'module', 'importmap'])

const scriptPattern = /<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi
const attributePattern = /([^\s=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g

function attributes(text: string): Map<string, string> {
  const found = new Map<string, string>()
  for (const match of text.matchAll(attributePattern)) {
    found.set(match[1]!.toLowerCase(), match[2] ?? match[3] ?? match[4] ?? '')
  }
  return found
}

// The text of every inline script in a page that the browser runs.
export function inlineScripts(html: string): string[] {
  const scripts: string[] = []
  for (const match of html.matchAll(scriptPattern)) {
    const attrs = attributes(match[1]!)
    if (attrs.has('src')) continue
    if (!runnableTypes.has((attrs.get('type') ?? '').trim().toLowerCase())) continue
    scripts.push(match[2]!)
  }
  return scripts
}

// A CSP hash source for one inline script: 'sha256-<base64>'.
export function scriptHash(script: string): string {
  return `'sha256-${createHash('sha256').update(script, 'utf8').digest('base64')}'`
}

// The hashes of every runnable inline script in these pages, each once, sorted.
export function pageScriptHashes(pages: string[]): string[] {
  return [...new Set(pages.flatMap(inlineScripts).map(scriptHash))].sort()
}

export function contentSecurityPolicy(scriptHashes: string[]): string {
  return [
    `default-src 'self'`,
    `script-src 'self' ${[...scriptHashes, beaconScriptOrigin].join(' ')}`,
    // Vue and @nuxt/fonts write inline styles and style attributes.
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' data:`,
    `font-src 'self'`,
    // contact-details.json (D-021) and the analytics beacon's reports.
    `connect-src 'self' ${beaconReportOrigin}`,
    // The nuxt-skew-protection service worker, /_nuxt-skew-sw.js (D-008).
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `object-src 'none'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `frame-ancestors 'none'`,
  ].join('; ')
}

export interface HeaderRule {
  path: string
  // Header names to drop that a broader rule set.
  detach?: string[]
  headers: Record<string, string>
}

export function headerRules(scriptHashes: string[]): HeaderRule[] {
  return [
    {
      path: '/*',
      headers: {
        'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': contentSecurityPolicy(scriptHashes),
        // HTML and every other file: the browser checks for a new copy each
        // time, so a new deploy shows up at once.
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    },
    {
      // File names hold a hash of the content, so they never change.
      path: '/_nuxt/*',
      detach: ['Cache-Control'],
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
    {
      // A service worker must never be served from an old cache.
      path: '/_nuxt-skew-sw.js',
      detach: ['Cache-Control'],
      headers: { 'Cache-Control': 'no-cache' },
    },
    {
      // Holds the email and the booking link (D-021). Keep it out of search.
      path: '/contact-details.json',
      headers: { 'X-Robots-Tag': 'noindex' },
    },
  ]
}

// The text of the `_headers` file. Throws if a line is longer than Workers reads.
export function headersFile(scriptHashes: string[]): string {
  const lines = ['# Written by modules/headers.ts at build time. Do not edit.']
  for (const rule of headerRules(scriptHashes)) {
    lines.push(rule.path)
    for (const name of rule.detach ?? []) lines.push(`  ! ${name}`)
    for (const [name, value] of Object.entries(rule.headers)) lines.push(`  ${name}: ${value}`)
  }
  const long = lines.find(line => line.length > maxHeaderLine)
  if (long) throw new Error(`_headers: a line is ${long.length} characters, more than the ${maxHeaderLine} Workers reads: ${long.slice(0, 60)}...`)
  return `${lines.join('\n')}\n`
}
