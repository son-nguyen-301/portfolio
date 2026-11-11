// https://nuxt.com/docs/api/configuration/nuxt-config
// The site is fully static: build it with `pnpm generate` (see docs/architecture.md).
import { themeHeadScript } from './shared/theme'
import { upworkHeadScript } from './app/utils/upwork'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/eslint',
  ],

  // OG images are off in `nuxt dev` only: with the site fonts in use, the
  // og-image module makes every dev page render hang. `nuxt generate` is not
  // affected. PF-021 (#47) builds the OG images and revisits this.
  $development: {
    ogImage: { enabled: false },
  },

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      meta: [{ name: 'color-scheme', content: 'light dark' }],
      // Before the page paints: apply a saved light or dark choice, and mark
      // <html> when the visit is in Upwork mode, so no contact link shows.
      script: [
        { innerHTML: themeHeadScript, tagPriority: 'critical' },
        { innerHTML: upworkHeadScript, tagPriority: 'critical' },
      ],
    },
  },

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css'],

  site: {
    url: 'https://me.haisonnguyen.dev',
    name: 'Hai Son Nguyen',
    defaultLocale: 'en',
  },

  content: {
    // Node 22.13+ has SQLite built in (no flag), so no native package has to be compiled.
    experimental: { sqliteConnector: 'native' },
  },

  compatibilityDate: '2026-09-30',

  typescript: {
    // Type check content.config.ts with the other build-time files.
    nodeTsConfig: { include: ['../content.config.ts'] },
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },

  // Self-hosted at build time from Google Fonts. Fallback stacks are in tokens.css.
  fonts: {
    families: [
      { name: 'Bricolage Grotesque', provider: 'google', weights: [500, 700] },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600] },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 600] },
    ],
    defaults: {
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
    },
  },
})
