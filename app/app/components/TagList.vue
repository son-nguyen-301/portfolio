<script setup lang="ts">
// Mono tags for stack items, for example ["Nuxt 4", "Vue 3"].
withDefaults(defineProps<{
  tags: string[]
  // Read by screen readers, for example "Stack".
  label?: string
}>(), {
  label: undefined,
})
</script>

<template>
  <ul
    v-if="tags.length"
    class="tag-list"
    :aria-label="label"
  >
    <li
      v-for="tag in tags"
      :key="tag"
      class="tag-list__tag"
    >
      {{ tag }}
    </li>
  </ul>
</template>

<style scoped>
.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.tag-list__tag {
  padding: 5px 9px;
  border: 1px solid var(--line);
  border-radius: 999px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-label);
  line-height: 1;
}
</style>
