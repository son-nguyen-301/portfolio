<script setup lang="ts">
// A placeholder until PF-016 builds this page. The career list is here now so
// a built page uses Timeline, and `pnpm generate` fails if its imports break
// the server build again (#73, D-027).
useSeoMeta({ title: 'About' })

const { data: timeline } = await useTimeline()
</script>

<template>
  <div>
    <h1>About</h1>
    <p class="lead">
      This page is not built yet.
    </p>
    <section
      v-if="timeline"
      aria-labelledby="career"
    >
      <h2 id="career">
        Career
      </h2>
      <Timeline :jobs="timeline.jobs" />
    </section>
  </div>
</template>
