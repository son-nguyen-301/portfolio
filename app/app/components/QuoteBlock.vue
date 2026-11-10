<script setup lang="ts">
// A written quote with a left jade rule and the person's role. A case study's
// `quote` is null until Son has a real quote, and then nothing renders.
defineProps<{
  quote: { text: string, role: string } | null
}>()
</script>

<template>
  <figure
    v-if="quote"
    class="quote-block"
  >
    <blockquote class="quote-block__text">
      <p>{{ quote.text }}</p>
    </blockquote>
    <figcaption class="quote-block__role">
      {{ quote.role }}
    </figcaption>
  </figure>
</template>

<style scoped>
.quote-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 4px 0 4px 18px;
  border-left: 3px solid var(--jade);
}

.quote-block__text {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.25rem;
  /* Bricolage Grotesque is loaded at 500 and 700 only (nuxt.config.ts). */
  font-weight: 500;
  line-height: 1.4;
}

.quote-block__role {
  color: var(--muted);
  font-size: var(--text-small);
}
</style>
