<script setup lang="ts">
// The page for a missing route (404.html in the build) and for any other
// error, inside the normal layout. PF-019 finishes the 404 page.
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)

useSeoMeta({ title: () => (notFound.value ? 'Page not found' : 'Something went wrong'), robots: 'noindex' })
</script>

<template>
  <NuxtLayout>
    <div class="error-page">
      <p class="num error-page__code">
        {{ error.statusCode }}
      </p>
      <h1>{{ notFound ? 'This page doesn\'t exist' : 'Something went wrong' }}</h1>
      <p class="lead">
        {{ notFound
          ? 'The link may be old, or there may be a typo in it. These two pages are a good place to start.'
          : 'Please try again, or start from the home page.' }}
      </p>
      <div class="error-page__actions">
        <AppButton
          to="/"
        >
          Go to the home page
        </AppButton>
        <AppButton
          to="/work"
          variant="ghost"
        >
          See my work
        </AppButton>
      </div>
    </div>
  </NuxtLayout>
</template>

<style scoped>
.error-page {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 18px;
  padding-block: 72px 96px;
}

.error-page__code {
  font-size: 4rem;
  line-height: 1;
}

.error-page__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  padding-top: 8px;
}
</style>
