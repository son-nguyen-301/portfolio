<script setup lang="ts">
// A big mono number with a short label under it. Used in case studies and the
// proof strip. `value` is text from app/content, for example "379 PRs".
defineProps<{
  value: string
  label: string
}>()
</script>

<template>
  <div class="metric-tile">
    <span class="metric-tile__value num">{{ value }}</span>
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
  overflow-wrap: anywhere;
}

.metric-tile__label {
  color: var(--muted);
  font-size: var(--text-small);
  line-height: 1.4;
}
</style>
