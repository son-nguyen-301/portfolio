// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-09-30',
  devtools: { enabled: true },
  nitro: {
    preset: 'aws-lambda',
    inlineDynamicImports: true,
    awsLambda: { streaming: true }
  }
})
