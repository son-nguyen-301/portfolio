// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  files: ['app/components/**/*.vue'],
  rules: {
    // Component names come from docs/design.md (Components).
    'vue/multi-word-component-names': ['error', { ignores: ['Timeline'] }],
  },
})
