// Fails `nuxt generate` and `nuxt build` when a file in content/ breaks its
// schema. Nuxt Content on its own only logs a warning and leaves the file out.
// In `nuxt dev` it logs the problems instead, so the dev server keeps running.
import { join } from 'node:path'
import { defineNuxtModule, useLogger } from 'nuxt/kit'
import { checkContent, formatIssues } from '../lib/content-check'

export default defineNuxtModule({
  meta: { name: 'content-check' },
  setup(_options, nuxt) {
    // `nuxt prepare` (run after every install) and `nuxt typecheck` skip it.
    if (nuxt.options._prepare) return
    const logger = useLogger('content-check')
    const dir = join(nuxt.options.rootDir, 'content')

    const run = () => {
      const { issues } = checkContent(dir)
      if (!issues.length) return
      const message = `${issues.length} problem(s) in content/:\n${formatIssues(issues)}`
      if (!nuxt.options.dev) throw new Error(message)
      logger.error(message)
    }

    run()
    if (nuxt.options.dev) {
      nuxt.hook('builder:watch', (_event, path) => {
        if (path.replace(/\\/g, '/').includes('content/')) run()
      })
    }
  },
})
