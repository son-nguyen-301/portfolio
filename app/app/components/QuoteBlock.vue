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
  gap: 10px;
  margin: 0;
  padding: 4px 0 4px 20px;
  border-left: 3px solid var(--jade);
}

.quote-block__text {
  margin: 0;
  font-size: var(--text-lead);
  line-height: 1.5;
}

.quote-block__role {
  color: var(--muted);
  font-size: var(--text-small);
}
</style>
