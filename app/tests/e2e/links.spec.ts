// The link checker over the generated site (PF-024, D-039): every internal
// link and asset in a built page, stylesheet, Markdown copy, text file or the
// sitemap resolves the way Workers serves the site, and every external link
// is https. The rules are in lib/links.ts. Run `pnpm generate` first.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test } from '@playwright/test'
import { checkLink, fileKind, findIds, findLinks } from '../../lib/links'

const built = fileURLToPath(new URL('../../.output/public', import.meta.url))
const site = 'https://me.haisonnguyen.dev'

function builtFiles(): string[] {
  return readdirSync(built, { withFileTypes: true, recursive: true })
    .filter(item => item.isFile())
    .map(item => relative(built, join(item.parentPath, item.name)).split(sep).join('/'))
    .sort()
}

test('every internal link resolves and every external link is https', () => {
  expect(existsSync(built), 'run pnpm generate first').toBe(true)
  const files = builtFiles()
  const ids = new Map<string, Set<string>>()
  const context = {
    site,
    exists: (file: string) => existsSync(join(built, file)) && statSync(join(built, file)).isFile(),
    ids: (file: string) => {
      if (!ids.has(file)) ids.set(file, findIds(readFileSync(join(built, file), 'utf8')))
      return ids.get(file)!
    },
  }

  const problems: string[] = []
  const external = new Set<string>()
  let checked = 0
  for (const file of files) {
    const kind = fileKind(file)
    if (!kind) continue
    for (const link of findLinks(readFileSync(join(built, file), 'utf8'), kind)) {
      checked++
      const problem = checkLink(link, file, context)
      if (problem) problems.push(`${file}: ${link} (${problem})`)
      else if (/^https:\/\//.test(link) && !link.startsWith(site)) external.add(link)
    }
  }
  console.log(`Checked ${checked} links in ${files.filter(file => fileKind(file)).length} files. External links: ${external.size}.`)
  expect(problems).toEqual([])
  // Every page links to the other pages, so far fewer links means the checker
  // stopped finding them.
  expect(checked).toBeGreaterThan(500)
})
