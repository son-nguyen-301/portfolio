// Puts the header and footer fields of content/profile.yml into app config
// (`siteProfile`), at build time. See shared/site-profile.ts for why.
// `nuxt dev` restarts when profile.yml changes.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'
import { parse } from 'yaml'
import { profileSchema } from '../shared/content/schemas'
import { pickSiteProfile } from '../shared/site-profile'

export default defineNuxtModule({
  meta: { name: 'site-profile' },
  setup(_options, nuxt) {
    const file = join(nuxt.options.rootDir, 'content', 'profile.yml')
    const profile = profileSchema.parse(parse(readFileSync(file, 'utf8')))
    nuxt.options.appConfig.siteProfile = pickSiteProfile(profile)
    nuxt.options.watch.push(file)
  },
})
