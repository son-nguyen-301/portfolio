// Adds the component gallery at /_gallery in `nuxt dev` only. The route does
// not exist in `nuxt generate`, so the page is never built and never in the
// sitemap.
import { createResolver, defineNuxtModule, extendPages } from 'nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'dev-gallery' },
  setup(_options, nuxt) {
    if (!nuxt.options.dev) return
    const { resolve } = createResolver(import.meta.url)
    extendPages((pages) => {
      pages.push({ name: 'dev-gallery', path: '/_gallery', file: resolve('../app/dev/DevGallery.vue') })
    })
  },
})
