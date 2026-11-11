<script setup lang="ts">
// A big mono number with a short label under it. Used in case studies and the
// proof strip. `value` is text from app/content, for example "379 PRs".
import { computed } from 'vue'

const props = defineProps<{
  value: string
  label: string
}>()

// Each word of the value stays whole, so a long value wraps at a space and
// never after a hyphen ("Fintech, e-" / "commerce").
const words = computed(() => props.value.split(' ').filter(Boolean))
</script>

<template>
  <div class="metric-tile">
    <span class="metric-tile__value num"><template
      v-for="(word, i) in words"
      :key="i"
    ><span class="metric-tile__word">{{ word }}</span>{{ i < words.length - 1 ? ' ' : '' }}</template></span>
    <span class="metric-tile__label">{{ label }}</span>
  </div>
</template>

<style scoped>
.metric-tile {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.metric-tile__value {
  font-size: var(--text-h3);
  line-height: 1.2;
}

.metric-tile__word {
  white-space: nowrap;
}

.metric-tile__label {
  color: var(--muted);
  font-size: var(--text-small);
  line-height: 1.4;
}
</style>
