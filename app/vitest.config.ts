import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Compiles .vue files for the component tests in tests/unit/components.
  plugins: [vue()],
  resolve: {
    // The same alias Nuxt gives app code for the shared/ folder.
    alias: { '#shared': fileURLToPath(new URL('./shared', import.meta.url)) },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    // Component tests set `// @vitest-environment happy-dom` at the top.
    environment: 'node',
  },
})
