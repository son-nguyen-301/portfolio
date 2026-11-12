<script setup lang="ts">
// The link preview image of every page (PF-021, D-037): 1200 x 630, light
// theme, the site's fonts. The page's label on top, its heading, the result
// line on case studies, and Son's name, title and the site's host at the
// bottom. The build renders it with Takumi into a PNG under /_og/s/.
//
// The renderer can't read tokens.css, so the colors come from `ogColors`
// (app/utils/og.ts), which a test keeps equal to the light tokens. The name and
// title come from app config (useSiteProfile), never the email or the booking
// link (CLAUDE.md hard rule 4).
import { siteHost } from '../../utils/cv'
import { ogColors as colors, ogFonts as fonts, ogTitleSize, ogWeight as weight } from '../../utils/og'

const { label = '', title = '', metric = '' } = defineProps<{
  label?: string
  title?: string
  metric?: string
}>()

const profile = useSiteProfile()
const host = siteHost(useSiteConfig().url)
const titleSize = ogTitleSize(title)
</script>

<template>
  <div
    class="w-full h-full flex flex-col"
    :style="{ backgroundColor: colors.paper, color: colors.ink, fontFamily: fonts.body, ...weight(400) }"
  >
    <div
      class="w-full flex"
      :style="{ height: '12px', backgroundColor: colors.jade }"
    />
    <div
      class="flex flex-col justify-between"
      :style="{ flexGrow: 1, padding: '64px 80px 56px' }"
    >
      <div class="flex flex-col">
        <div
          class="flex"
          :style="{ fontFamily: fonts.mono, fontSize: '26px', ...weight(400), letterSpacing: '0.08em', textTransform: 'uppercase', color: colors.muted }"
        >
          {{ label }}
        </div>
        <div
          class="flex"
          :style="{ marginTop: '28px', fontFamily: fonts.display, fontSize: `${titleSize}px`, ...weight(700), lineHeight: 1.12, color: colors.ink }"
        >
          {{ title }}
        </div>
        <div
          v-if="metric"
          class="flex"
          :style="{ marginTop: '32px', fontFamily: fonts.mono, fontSize: '34px', ...weight(600), color: colors.jade }"
        >
          {{ metric }}
        </div>
      </div>
      <div
        class="flex items-end justify-between"
        :style="{ borderTop: `2px solid ${colors.line}`, paddingTop: '28px' }"
      >
        <div class="flex flex-col">
          <div
            class="flex"
            :style="{ fontFamily: fonts.display, fontSize: '34px', ...weight(700), color: colors.ink }"
          >
            {{ profile.name }}
          </div>
          <div
            class="flex"
            :style="{ marginTop: '6px', fontSize: '26px', ...weight(500), color: colors.muted }"
          >
            {{ profile.title }}
          </div>
        </div>
        <div
          class="flex"
          :style="{ fontFamily: fonts.mono, fontSize: '26px', ...weight(600), color: colors.jade }"
        >
          {{ host }}
        </div>
      </div>
    </div>
  </div>
</template>
