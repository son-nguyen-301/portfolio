// Serves the built site (.output/public) the way Cloudflare Workers static
// assets serves the live site (lib/workers-assets.ts): no trailing slash,
// 404.html for a missing path, the headers from `_headers`, and gzip for text.
// `pnpm test:quality` uses it, because Lighthouse scores an uncompressed site
// far lower than the live one (the note on #48: Performance 97 against 81).
//
// Run `pnpm generate` first. Host 127.0.0.1, port QUALITY_PORT (default 4174,
// not the browser tests' 4173, so both can run at once).
import { createServer } from 'node:http'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { contentType, headersFor, isCompressible, readHeaderRules, resolveAsset } from '../lib/workers-assets.ts'

const root = fileURLToPath(new URL('../.output/public', import.meta.url))
const port = Number(process.env.QUALITY_PORT ?? 4174)

if (!existsSync(join(root, 'index.html'))) {
  console.error('No built site in .output/public. Run `pnpm generate` first.')
  process.exit(1)
}

const headersFile = join(root, '_headers')
const rules = existsSync(headersFile) ? readHeaderRules(readFileSync(headersFile, 'utf8')) : []

function exists(file: string): boolean {
  const full = normalize(join(root, file))
  if (!full.startsWith(root)) return false
  return existsSync(full) && statSync(full).isFile()
}

const server = createServer((request, response) => {
  let path: string
  try {
    path = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
  }
  catch {
    response.writeHead(400).end()
    return
  }
  const resolved = resolveAsset(path, exists)
  if (resolved.kind === 'redirect') {
    response.writeHead(307, { location: resolved.location }).end()
    return
  }
  // Headers rules match the URL path; the 404 page carries the rules of the
  // path that was asked for.
  const headers = headersFor(rules, path)
  const type = contentType(resolved.file)
  let body = readFileSync(join(root, resolved.file))
  headers.set('content-type', type)
  if (isCompressible(type) && /\bgzip\b/.test(String(request.headers['accept-encoding'] ?? ''))) {
    body = gzipSync(body)
    headers.set('content-encoding', 'gzip')
    headers.set('vary', 'Accept-Encoding')
  }
  headers.set('content-length', String(body.length))
  response.writeHead(resolved.status, Object.fromEntries(headers))
  response.end(request.method === 'HEAD' ? undefined : body)
})

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}`)
})
