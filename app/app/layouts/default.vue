<script setup lang="ts">
// Every page: a skip link, the header, the page and the footer.
// The profile fields come from app config, with no content query, so the
// email and the booking link never reach the browser (CLAUDE.md hard rule 4).
const profile = useSiteProfile()

// Reads Upwork mode after mount, for the whole visit. The head script already
// marked <html> before the page painted, so the header and footer show the
// right links at once (docs/brief.md, Upwork mode).
useUpworkMode()

// The year of the build, kept in the page data so the browser shows the same.
const year = useState('footer-year', () => new Date().getFullYear())
</script>

<template>
  <div class="site">
    <a
      class="skip-link"
      href="#main"
    >Skip to content</a>
    <SiteHeader
      :name="profile.name"
      :upwork="profile.links.upwork"
      :hours="profile.hours"
      :reply-promise="profile.replyPromise"
    />
    <main
      id="main"
      class="container site-main"
      tabindex="-1"
    >
      <slot />
    </main>
    <SiteFooter
      :name="profile.name"
      :title="profile.title"
      :location="profile.location"
      :links="profile.links"
      :year="year"
    />
  </div>
</template>

<style scoped>
.site {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.site-main {
  flex: 1;
  padding-top: 48px;
}

.site-main:focus {
  outline: none;
}

.skip-link {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 20;
  padding: 10px 16px;
  border-radius: var(--radius);
  background: var(--ink);
  color: var(--paper);
  font-weight: 600;
  text-decoration: none;
  transform: translateY(-200%);
}

.skip-link:focus {
  transform: none;
}
</style>
