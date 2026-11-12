// https://nuxt.com/docs/api/configuration/nuxt-config
// The site is fully static: build it with `pnpm generate` (see docs/architecture.md).
import { themeHeadScript } from './shared/theme'
import { upworkHeadScript } from './app/utils/upwork'
import { ogImageSize } from './app/utils/og'

export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/fonts',
    '@nuxt/eslint',
  ],

  // OG images are off in `nuxt dev` only: with the site fonts in use, the
  // og-image module makes every dev page render hang (D-017). `nuxt generate`
  // is not affected.
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

  css: ['~/assets/css/tokens.css', '~/assets/css/base.css', '~/assets/css/diagrams.css'],

  site: {
    url: 'https://me.haisonnguyen.dev',
    name: 'Hai Son Nguyen',
    defaultLocale: 'en',
  },

  content: {
    // Node 22.13+ has SQLite built in (no flag), so no native package has to be compiled.
    experimental: { sqliteConnector: 'native' },
  },

  runtimeConfig: {
    public: {
      // The public site token of Cloudflare Web Analytics. Empty: no beacon.
      // Set NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN when you build (D-025).
      cloudflareAnalyticsToken: '',
    },
  },

  // Render 404.html at build time from app/error.vue, so the page shows
  // without JavaScript. Without this, Nuxt writes 404.html as an empty app
  // shell (D-035).
  experimental: {
    prerenderErrorPages: [404],
  },

  compatibilityDate: '2026-09-30',

  // Always a static build. Workers Builds sets WORKERS_CI, and without this
  // Nitro then picks its Cloudflare preset, which prerenders no pages.
  nitro: {
    preset: 'static',
  },

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
  // `global: true` also hands each family to the OG image renderer (D-037).
  fonts: {
    families: [
      { name: 'Bricolage Grotesque', provider: 'google', weights: [500, 700], global: true },
      { name: 'Inter', provider: 'google', weights: [400, 500, 600], global: true },
      { name: 'JetBrains Mono', provider: 'google', weights: [400, 600], global: true },
    ],
    defaults: {
      styles: ['normal'],
      subsets: ['latin', 'latin-ext'],
    },
  },

  // Link preview images (D-037): every page calls usePageOgImage(), and the
  // build renders app/components/OgImage/PageCard.takumi.vue into a PNG under
  // /_og/s/. The site is static, so no image is drawn at request time.
  // `zeroRuntime` (Son's choice in PF-022): the module ships no code to the
  // browser, so after a click to another page the image tags in the browser
  // stay the first page's. Link previews are not affected: LinkedIn and
  // Upwork load each page's built HTML.
  ogImage: {
    zeroRuntime: true,
    defaults: { ...ogImageSize },
  },

  // The skew service worker stays (D-008). Its multi-tab plugin only passes a
  // reload prompt between open tabs, and the site shows no such prompt, so it
  // is off: 1.4 KB gzip less JavaScript on every page (PF-022).
  skewProtection: {
    multiTab: false,
  },
})
