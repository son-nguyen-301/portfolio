<script setup lang="ts">
// The screens and diagrams of a case study (docs/design/CaseStudy.dc.html,
// "Screens"). Images go through @nuxt/image, lazy, at a fixed size so nothing
// moves when they load. An item that doesn't exist yet (no `src`, a caption
// that starts with "TODO", or a diagram PF-014 hasn't built) shows a neutral
// placeholder with the `alt` text as its caption, never a broken image or the
// TODO note.
import { computed } from 'vue'
import type { Component } from 'vue'
import { mediaView } from '../utils/case-study'
import type { MediaItem } from '../utils/case-study'
import { diagrams as builtDiagrams } from '../utils/diagrams'

const props = withDefaults(defineProps<{
  items: MediaItem[]
  // The diagram components by name. Tests pass their own.
  diagrams?: Partial<Record<string, Component>>
}>(), {
  diagrams: () => builtDiagrams,
})

const views = computed(() => props.items.map(item => ({
  item,
  ...mediaView(item, name => Boolean(props.diagrams[name])),
})))
</script>

<template>
  <div
    v-if="items.length"
    :class="['case-media', { 'case-media--single': items.length === 1 }]"
  >
    <figure
      v-for="(view, i) in views"
      :key="i"
      class="case-media__item"
      :data-media="view.show"
    >
      <div
        v-if="view.show === 'image'"
        class="case-media__frame"
      >
        <NuxtImg
          :src="view.item.src"
          :alt="view.item.alt"
          width="960"
          height="600"
          sizes="100vw md:640px"
          loading="lazy"
          class="case-media__image"
        />
      </div>
      <div
        v-else-if="view.show === 'diagram'"
        class="case-media__diagram"
        role="img"
        :aria-label="view.item.alt"
      >
        <component :is="diagrams[view.item.src!]" />
      </div>
      <div
        v-else
        class="case-media__frame case-media__placeholder"
      >
        <span class="label">{{ view.item.type === 'image' ? 'Screenshot coming' : 'Diagram coming' }}</span>
      </div>
      <figcaption
        v-if="view.caption"
        class="case-media__caption"
      >
        {{ view.caption }}
      </figcaption>
    </figure>
  </div>
</template>

<style scoped>
.case-media {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
}

.case-media__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}

.case-media__frame {
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.case-media__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.case-media__diagram {
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.case-media__placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(135deg, var(--paper) 0 12px, var(--line) 12px 13px);
}

.case-media__caption {
  color: var(--muted);
  font-size: var(--text-small);
}

@media (min-width: 760px) {
  .case-media:not(.case-media--single) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
