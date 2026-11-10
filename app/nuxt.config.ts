// https://nuxt.com/docs/api/configuration/nuxt-config
// The site is fully static: build it with `pnpm generate` (see docs/architecture.md).
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/eslint',
  ],

  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
    },
  },

  site: {
    url: 'https://me.haisonnguyen.dev',
    name: 'Hai Son Nguyen',
    defaultLocale: 'en',
  },

  content: {
    // Node 22.5+ has SQLite built in, so no native package has to be compiled.
    experimental: { sqliteConnector: 'native' },
  },

  compatibilityDate: '2026-09-30',

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
