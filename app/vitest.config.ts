import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // Compiles .vue files for the component tests in tests/unit/components.
  plugins: [vue()],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    // Component tests set `// @vitest-environment happy-dom` at the top.
    environment: 'node',
  },
})
