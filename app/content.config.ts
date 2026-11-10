// The 7 content collections. See docs/content-model.md.
// The schemas and sources live in shared/content/schemas.ts, so the build
// check in modules/content-check.ts reads the same rules.
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { collections as c } from './shared/content/schemas'

export default defineContentConfig({
  collections: {
    profile: defineCollection(c.profile),
    services: defineCollection(c.services),
    timeline: defineCollection(c.timeline),
    skills: defineCollection(c.skills),
    work: defineCollection(c.work),
    lab: defineCollection(c.lab),
    earlier: defineCollection(c.earlier),
  },
})
