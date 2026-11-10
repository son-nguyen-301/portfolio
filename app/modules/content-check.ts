// Fails `nuxt generate` and `nuxt build` when a file in content/ breaks its
// schema. Nuxt Content on its own only logs a warning and leaves the file out.
// `nuxt dev` logs the problems once at start and keeps running.
import { join } from 'node:path'
import { defineNuxtModule, useLogger } from 'nuxt/kit'
import { checkOnStart } from '../lib/content-check'

export default defineNuxtModule({
  meta: { name: 'content-check' },
  setup(_options, nuxt) {
    // `nuxt prepare` (run after every install) and `nuxt typecheck` skip it.
    if (nuxt.options._prepare) return
    const logger = useLogger('content-check')
    checkOnStart(join(nuxt.options.rootDir, 'content'), {
      dev: nuxt.options.dev,
      log: message => logger.error(message),
    })
  },
})
