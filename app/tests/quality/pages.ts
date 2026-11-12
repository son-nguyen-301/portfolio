// The pages the quality checks open: every built page, found from the HTML
// files in .output/public, so a new page is checked without a code change.
// `200.html` is the app's fallback shell, not a page (D-036). The 404 page is
// opened at a path that does not exist, as a visitor gets it.
import { readdirSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export const built = fileURLToPath(new URL('../../.output/public', import.meta.url))

export const missingPath = '/no-such-page'

export function builtPages(): string[] {
  const paths = readdirSync(built, { withFileTypes: true, recursive: true })
    .filter(item => item.isFile() && item.name.endsWith('.html'))
    .map(item => relative(built, join(item.parentPath, item.name)).split(sep).join('/'))
    .filter(file => file !== '200.html')
    .map((file) => {
      if (file === '404.html') return missingPath
      if (file === 'index.html') return '/'
      return `/${file.replace(/\/index\.html$/, '').replace(/\.html$/, '')}`
    })
  return paths.sort()
}
