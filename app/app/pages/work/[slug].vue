<script setup lang="ts">
// A placeholder until PF-013 builds the case study page. The home page cards
// link here, so each link opens a real page with the case study's title.
const route = useRoute()
const path = `/work/${route.params.slug}`
const { data: study } = await useCaseStudy(path)

if (!study.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

useSeoMeta({ title: study.value.title })
</script>

<template>
  <div>
    <h1>{{ study?.title }}</h1>
    <p class="lead">
      This page is not built yet.
    </p>
  </div>
</template>
