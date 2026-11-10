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
})
