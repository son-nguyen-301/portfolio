// Writes `_headers` into the built site (lib/headers.ts, D-025). It runs once
// every page is prerendered, reads every built HTML file and lists the hash of
// each inline script in the Content Security Policy.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'
import { headersFile, pageScriptHashes } from '../lib/headers'

function htmlFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true, recursive: true })
    .filter(item => item.isFile() && item.name.endsWith('.html'))
    .map(item => join(item.parentPath, item.name))
}

export default defineNuxtModule({
  meta: { name: 'headers' },
  setup(_options, nuxt) {
    nuxt.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('prerender:done', () => {
        const dir = nitro.options.output.publicDir
        const pages = htmlFiles(dir).map(file => readFileSync(file, 'utf8'))
        if (pages.length === 0) throw new Error('_headers: the build has no HTML pages to read.')
        writeFileSync(join(dir, '_headers'), headersFile(pageScriptHashes(pages)))
        nitro.logger.success(`Wrote _headers for ${pages.length} pages`)
      })
    })
  },
})
