<script setup lang="ts">
// A placeholder until PF-019 builds this page. It already shows the contact
// block, so the Upwork mode tests cover a real page.
useSeoMeta({ title: 'Contact' })

const profile = useSiteProfile()
</script>

<template>
  <div class="contact-page">
    <h1>Contact</h1>
    <p class="lead">
      This page is not built yet.
    </p>
    <ContactBlock
      :upwork="profile.links.upwork"
      :hours="profile.hours"
      :reply-promise="profile.replyPromise"
    />
  </div>
</template>

<style scoped>
.contact-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 640px;
}
</style>
