<script setup lang="ts">
// Son as a schema.org Person on every page: the site's identity, which the
// WebSite node and each case study's CreativeWork point to (D-036). The fields
// come from app config (useSiteProfile), never the email or the booking link
// (CLAUDE.md hard rule 4).
const profile = useSiteProfile()

useSchemaOrg([
  definePerson({
    name: profile.name,
    jobTitle: profile.title,
    url: `${useSiteConfig().url}/`,
    sameAs: [profile.links.linkedin, profile.links.github, profile.links.upwork],
  }),
])
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
