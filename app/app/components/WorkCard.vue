<script setup lang="ts">
// A case study card. The whole card is one link to the case study, so there
// is no other link or button inside it.
// Fields come from the front matter of app/content/work/*.md.
import TagList from './TagList.vue'

withDefaults(defineProps<{
  // The case study's page path, for example "/work/aspire-redesign".
  to: string
  title: string
  summary: string
  stack: string[]
  // `cardMetric`: one short result line, shown in mono jade.
  metric?: string
  heading?: 'h2' | 'h3'
}>(), {
  metric: undefined,
  heading: 'h3',
})

// The `media` slot holds the image or diagram (PF-014 adds the diagrams).
defineSlots<{ media?: () => unknown }>()
</script>

<template>
  <NuxtLink
    :to="to"
    class="work-card"
  >
    <div
      v-if="$slots.media"
      class="work-card__media"
    >
      <slot name="media" />
    </div>
    <div class="work-card__body">
      <p
        v-if="metric"
        class="work-card__metric num"
      >
        {{ metric }}
      </p>
      <component
        :is="heading"
        class="work-card__title"
      >
        {{ title }}
      </component>
      <p class="work-card__summary">
        {{ summary }}
      </p>
      <TagList
        :tags="stack"
        label="Stack"
      />
    </div>
  </NuxtLink>
</template>

<style scoped>
.work-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  color: var(--ink);
  text-decoration: none;
  transition: border-color 0.15s;
}

.work-card:hover {
  border-color: var(--jade);
}

.work-card:hover .work-card__title {
  text-decoration: underline;
  text-decoration-thickness: 1px;
  text-underline-offset: 0.18em;
}

.work-card__media {
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}

.work-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.work-card__metric {
  font-size: var(--text-small);
}

.work-card__title {
  font-size: 1.25rem;
  font-weight: 700;
}

.work-card__summary {
  color: var(--muted);
  font-size: var(--text-small);
}
</style>
