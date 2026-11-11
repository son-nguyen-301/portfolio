// Keeps the email and the booking link out of every page (CLAUDE.md hard
// rule 4, D-021). Two parts:
//
// 1. It writes the two fields of content/profile.yml into one file, served at
//    /contact-details.json (app/utils/contact.ts). Only ContactBlock downloads
//    it, and only when the visit is not in Upwork mode.
// 2. It stops `nuxt generate` from writing Nuxt Content's copy of the profile
//    collection (/__nuxt_content/profile/sql_dump.txt), which holds every field,
//    the email and the booking link included. Pages read the profile at build
//    time only, so the browser never needs that copy.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'
import { parse } from 'yaml'
import { profileSchema } from '../shared/content/schemas'
import { contactDetailsPath, pickContactDetails } from '../app/utils/contact'

export const profileDumpRoute = '/__nuxt_content/profile/sql_dump.txt'

export default defineNuxtModule({
  meta: { name: 'contact-details' },
  setup(_options, nuxt) {
    const file = join(nuxt.options.rootDir, 'content', 'profile.yml')
    nuxt.options.watch.push(file)

    // Outside the build folder, which Nuxt empties after the modules run.
    const dir = join(nuxt.options.rootDir, 'node_modules', '.cache', 'contact-details')
    const profile = profileSchema.parse(parse(readFileSync(file, 'utf8')))
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, contactDetailsPath.slice(1)), JSON.stringify(pickContactDetails(profile)))
    nuxt.hook('nitro:config', (config) => {
      config.publicAssets ||= []
      config.publicAssets.push({ dir, maxAge: 0 })
    })

    // @nuxt/content marks every collection copy for prerendering in its own
    // setup, so this runs after all modules.
    nuxt.hook('modules:done', () => {
      nuxt.options.routeRules ||= {}
      nuxt.options.routeRules[profileDumpRoute] = { ...nuxt.options.routeRules[profileDumpRoute], prerender: false }
    })
  },
})
