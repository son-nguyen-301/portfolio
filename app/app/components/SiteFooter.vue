<script setup lang="ts">
// The site footer: who Son is, the page links, links elsewhere, the theme
// switch, the stats line and the copyright.
// In Upwork mode the Contact and LinkedIn links hide (docs/design.md, Screens),
// with the classes in assets/css/base.css.
import { siteLinks } from '../utils/nav'

const props = defineProps<{
  name: string
  // profile.title and profile.location.
  title: string
  location: string
  // profile.links. Never the email or the booking link (CLAUDE.md hard rule 4).
  links: { linkedin: string, github: string, upwork: string }
  // profile.siteStats: numbers from a measured run (D-039).
  stats: { lighthouse: number, javascriptKb: number }
  year: number
}>()

const elsewhere = [
  { label: 'LinkedIn', href: props.links.linkedin, hideInUpwork: true },
  { label: 'GitHub', href: props.links.github },
  { label: 'Upwork', href: props.links.upwork },
]
</script>

<template>
  <footer class="site-footer">
    <div class="container site-footer__grid">
      <div class="site-footer__about">
        <p class="site-footer__name">
          {{ name }}<span
            class="site-footer__dot"
            aria-hidden="true"
          >.</span>
        </p>
        <p class="small site-footer__muted">
          {{ title }} in {{ location }}. Vue, Nuxt, the server side of my apps, and AI workflows.
        </p>
        <p class="site-footer__stats">
          This site: Lighthouse {{ stats.lighthouse }}, {{ stats.javascriptKb }} KB of JavaScript, built with Nuxt.
        </p>
      </div>

      <nav
        aria-label="Footer"
        class="site-footer__column"
      >
        <span class="label">Site</span>
        <NuxtLink
          v-for="link in siteLinks"
          :key="link.to"
          :to="link.to"
          :class="['site-footer__link', { 'not-upwork': link.hideInUpwork }]"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="site-footer__column">
        <span class="label">Elsewhere</span>
        <a
          v-for="link in elsewhere"
          :key="link.label"
          :href="link.href"
          :class="['site-footer__link', { 'not-upwork': link.hideInUpwork }]"
        >{{ link.label }}</a>
        <span class="label site-footer__theme-label">Theme</span>
        <ThemeSwitch />
      </div>
    </div>
    <p class="container small site-footer__muted site-footer__copyright">
      © {{ year }} {{ name }}
    </p>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: 64px;
  border-top: 1px solid var(--line);
}

.site-footer__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1fr);
  gap: 32px;
  padding-block: 40px;
}

/* Rows stack to one column below 720px (docs/design.md, Layout). */
@media (max-width: 720px) {
  .site-footer__grid {
    grid-template-columns: minmax(0, 1fr);
  }
}

.site-footer__about,
.site-footer__column {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.site-footer__about {
  gap: 12px;
}

.site-footer__name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
}

.site-footer__dot {
  color: var(--jade);
}

.site-footer__muted {
  color: var(--muted);
}

.site-footer__stats {
  font-family: var(--font-mono);
  font-size: var(--text-label);
  color: var(--muted);
}

.site-footer__link {
  align-self: flex-start;
  color: var(--ink);
  font-size: 0.9375rem;
  text-decoration: none;
}

.site-footer__link:hover {
  color: var(--jade);
  text-decoration: underline;
}

.site-footer__theme-label {
  padding-top: 12px;
}

.site-footer__copyright {
  max-width: calc(var(--content-max) + 2 * var(--gutter));
  padding-bottom: 28px;
}
</style>
