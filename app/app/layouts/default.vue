<template>
  <div class="site">
    <main class="container">
      <slot />
    </main>
    <!-- A minimal footer until SiteFooter lands (PF-006). -->
    <footer class="container site-footer">
      <ThemeSwitch />
    </footer>
  </div>
</template>

<style scoped>
.site-footer {
  margin-top: 48px;
  padding-block: 32px;
  border-top: 1px solid var(--line);
}
</style>
