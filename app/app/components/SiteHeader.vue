<script setup lang="ts">
// The site header: name with a jade dot, the page links and one action button.
// At 860px and below, the links and the button move into a phone menu, a modal
// <dialog>: the browser keeps focus inside it and closes it on Escape.
// In Upwork mode the Contact link and "Book a 30-minute call" hide, and
// "Message me on Upwork" shows instead (classes in assets/css/base.css).
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { mainLinks, siteLinks } from '../utils/nav'
import AppButton from './AppButton.vue'

defineProps<{
  name: string
  // profile.links.upwork, for the Upwork mode button.
  upwork: string
  // profile.hours.label and profile.replyPromise, shown in the phone menu.
  hours: string
  replyPromise: string
}>()

const menu = ref<HTMLDialogElement | null>(null)
const menuButton = ref<HTMLButtonElement | null>(null)
const menuOpen = ref(false)

function openMenu() {
  menu.value?.showModal()
  menuOpen.value = true
}

function closeMenu() {
  menu.value?.close()
}

// Runs on every close: the close button, a link, Escape, or a wider window.
function onMenuClose() {
  menuOpen.value = false
  menuButton.value?.focus()
}

// The menu is for narrow screens. If the window gets wider than the
// breakpoint in the styles below, close it.
let wide: MediaQueryList | undefined
function onWidthChange(event: { matches: boolean }) {
  if (event.matches) closeMenu()
}
// Browser Back or Forward opens another page under the menu, so close it.
onMounted(() => {
  wide = window.matchMedia('(min-width: 861px)')
  wide.addEventListener('change', onWidthChange)
  window.addEventListener('popstate', closeMenu)
})
onBeforeUnmount(() => {
  wide?.removeEventListener('change', onWidthChange)
  window.removeEventListener('popstate', closeMenu)
})
</script>

<template>
  <header class="site-header">
    <div class="container site-header__bar">
      <NuxtLink
        to="/"
        class="site-header__name"
      >
        {{ name }}<span
          class="site-header__dot"
          aria-hidden="true"
        >.</span>
      </NuxtLink>

      <nav
        aria-label="Main"
        class="site-header__nav"
      >
        <NuxtLink
          v-for="link in mainLinks"
          :key="link.to"
          :to="link.to"
          :class="['site-header__link', { 'not-upwork': link.hideInUpwork }]"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <AppButton
        to="/contact"
        variant="action"
        class="site-header__action not-upwork"
      >
        Book a 30-minute call
      </AppButton>
      <AppButton
        :to="upwork"
        variant="action"
        class="site-header__action upwork-only"
      >
        Message me on Upwork
      </AppButton>

      <button
        ref="menuButton"
        type="button"
        class="site-header__icon site-header__menu-button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-controls="site-menu"
        :aria-expanded="menuOpen"
        @click="openMenu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          aria-hidden="true"
        ><path d="M4 7h16M4 12h16M4 17h16" /></svg>
      </button>
    </div>

    <dialog
      id="site-menu"
      ref="menu"
      class="site-menu"
      aria-label="Menu"
      @close="onMenuClose"
    >
      <div class="site-menu__bar">
        <span class="site-header__name">{{ name }}<span
          class="site-header__dot"
          aria-hidden="true"
        >.</span></span>
        <button
          type="button"
          class="site-header__icon"
          aria-label="Close menu"
          @click="closeMenu"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          ><path d="M6 6l12 12M18 6L6 18" /></svg>
        </button>
      </div>

      <nav
        aria-label="Pages"
        class="site-menu__nav"
      >
        <NuxtLink
          v-for="link in siteLinks"
          :key="link.to"
          :to="link.to"
          :class="['site-menu__link', { 'not-upwork': link.hideInUpwork }]"
          @click="closeMenu"
        >
          <span>{{ link.label }}</span>
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            aria-hidden="true"
          ><path d="M9 6l6 6-6 6" /></svg>
        </NuxtLink>
      </nav>

      <div class="site-menu__foot">
        <AppButton
          to="/contact"
          variant="action"
          class="not-upwork"
          @click="closeMenu"
        >
          Book a 30-minute call
        </AppButton>
        <AppButton
          :to="upwork"
          variant="action"
          class="upwork-only"
          @click="closeMenu"
        >
          Message me on Upwork
        </AppButton>
        <p class="small site-menu__hours">
          {{ hours }}. {{ replyPromise }}
        </p>
        <div class="site-menu__theme">
          <span class="label">Theme</span>
          <ThemeSwitch />
        </div>
      </div>
    </dialog>
  </header>
</template>

<style scoped>
.site-header {
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}

.site-header__bar {
  display: flex;
  align-items: center;
  gap: 28px;
  min-height: 72px;
}

.site-header__name {
  font-family: var(--font-display);
  font-size: 1.125rem;
  font-weight: 700;
  line-height: 1;
  color: var(--ink);
  text-decoration: none;
  white-space: nowrap;
}

.site-header__dot {
  color: var(--jade);
}

.site-header__nav {
  display: flex;
  gap: 24px;
  margin-left: auto;
  font-size: 0.9375rem;
}

.site-header__link {
  padding: 10px 2px;
  border-bottom: 2px solid transparent;
  color: var(--muted);
  text-decoration: none;
}

.site-header__link:hover {
  color: var(--ink);
}

/* The page you are on, and its sub-pages (a case study under Work). */
.site-header__link.router-link-active {
  border-bottom-color: var(--jade);
  color: var(--ink);
}

.site-header__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: transparent;
  color: var(--ink);
  cursor: pointer;
}

.site-header__menu-button {
  display: none;
  margin-left: auto;
}

/* Phones and small tablets: the menu button replaces the links and the
   action button, and the header stays on screen while you scroll. */
@media (max-width: 860px) {
  .site-header {
    position: sticky;
    top: 0;
    z-index: 10;
  }

  .site-header__bar {
    min-height: 60px;
  }

  .site-header__nav,
  .site-header__action {
    display: none;
  }

  .site-header__menu-button {
    display: inline-flex;
  }
}

.site-menu {
  width: 100%;
  max-width: none;
  height: 100%;
  max-height: none;
  margin: 0;
  padding: 0;
  border: 0;
  background: var(--paper);
  color: var(--ink);
}

.site-menu[open] {
  display: flex;
  flex-direction: column;
}

.site-menu__bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
  padding: 0 var(--gutter);
  border-bottom: 1px solid var(--line);
}

.site-menu__nav {
  display: flex;
  flex-direction: column;
  padding: 16px 20px;
}

.site-menu__link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 52px;
  border-bottom: 1px solid var(--line);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: 1.25rem;
  font-weight: 500;
  text-decoration: none;
}

.site-menu__link svg {
  color: var(--muted);
}

.site-menu__link.router-link-active {
  color: var(--jade);
}

.site-menu__foot {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-top: auto;
  padding: 20px;
  border-top: 1px solid var(--line);
}

.site-menu__hours {
  color: var(--muted);
}

.site-menu__theme {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
</style>

<style>
/* The page behind the open phone menu does not scroll. */
html:has(.site-menu[open]) {
  overflow: hidden;
}
</style>
