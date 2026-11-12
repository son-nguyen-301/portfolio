// Drops the og-image module's fallback fonts from the built site (D-037). The
// module copies Inter 400 and 700 into `/_og-static-fonts/` for its renderer.
// The site is static, so every preview image is rendered while the pages are
// prerendered, and nothing asks for these files after that (#47). Nitro copies
// the public files after the prerender, so this runs once the build is done.
import { rmSync } from 'node:fs'
import { join } from 'node:path'
import { defineNuxtModule } from 'nuxt/kit'

export default defineNuxtModule({
  meta: { name: 'og-image-fonts' },
  setup(_options, nuxt) {
    if (nuxt.options.dev) return
    nuxt.hook('nitro:init', (nitro) => {
      nitro.hooks.hook('compiled', () => {
        rmSync(join(nitro.options.output.publicDir, '_og-static-fonts'), { recursive: true, force: true })
      })
    })
  },
})
