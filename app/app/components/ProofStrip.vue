<script setup lang="ts">
// The facts row on the home page: 4 facts with dividers, 2 by 2 on phones.
// Items come from `proofStrip` in app/content/profile.yml.
import MetricTile from './MetricTile.vue'

defineProps<{
  items: Array<{ value: string, label: string }>
}>()
</script>

<template>
  <ul class="proof-strip">
    <li
      v-for="item in items"
      :key="`${item.value}-${item.label}`"
      class="proof-strip__item"
    >
      <MetricTile
        :value="item.value"
        :label="item.label"
      />
    </li>
  </ul>
</template>

<style scoped>
.proof-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-block: 1px solid var(--line);
  list-style: none;
}

.proof-strip__item {
  padding: 16px;
}

/* 2 by 2: a line between the columns and between the rows. */
.proof-strip__item:nth-child(odd) {
  padding-left: 0;
}

.proof-strip__item:nth-child(even) {
  border-left: 1px solid var(--line);
}

.proof-strip__item:nth-child(n + 3) {
  border-top: 1px solid var(--line);
}

@media (min-width: 720px) {
  .proof-strip {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .proof-strip__item,
  .proof-strip__item:nth-child(odd) {
    padding: 20px 20px 20px 24px;
  }

  .proof-strip__item:first-child {
    padding-left: 0;
  }

  .proof-strip__item:nth-child(n + 3) {
    border-top: 0;
  }

  .proof-strip__item:nth-child(n + 2) {
    border-left: 1px solid var(--line);
  }
}
</style>
