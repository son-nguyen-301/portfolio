<script setup lang="ts">
// One side project on the Lab page (PF-017, docs/design/Lab.dc.html): the
// screenshot or diagram on top, then the name with its status tag, the summary,
// the stack and, only when the project has one, a link out. Every word but the
// placeholder and link labels comes from app/content/lab/*.yml. A diagram is an
// <svg role="img"> whose <title> is the media's `alt` text, so nothing around
// it carries another role (D-031).
import { computed } from 'vue'
import type { Component } from 'vue'
import type { MediaItem } from '../utils/case-study'
import { diagrams as builtDiagrams } from '../utils/diagrams'
import { labMedia, linkLabel, statusTone } from '../utils/lab'
import TagList from './TagList.vue'

const props = withDefaults(defineProps<{
  name: string
  summary: string
  status: string
  stack: string[]
  link?: string | null
  media: MediaItem
  heading?: 'h2' | 'h3'
  // The diagram components by name. Tests pass their own.
  diagrams?: Partial<Record<string, Component>>
}>(), {
  link: null,
  heading: 'h3',
  diagrams: () => builtDiagrams,
})

const view = computed(() => labMedia(props.media, name => Boolean(props.diagrams[name])))
const tone = computed(() => statusTone(props.status))
</script>

<template>
  <article class="lab-card">
    <div
      :class="['lab-card__media', `lab-card__media--${view.show}`]"
      :data-media="view.show"
    >
      <NuxtImg
        v-if="view.show === 'image'"
        :src="media.src"
        :alt="media.alt"
        width="960"
        height="540"
        sizes="100vw md:520px"
        loading="lazy"
        class="lab-card__image"
      />
      <component
        :is="diagrams[media.src!]"
        v-else-if="view.show === 'diagram'"
        :title="media.alt"
      />
      <span
        v-else
        class="label"
      >{{ view.label }}</span>
    </div>
    <div class="lab-card__body">
      <div class="lab-card__top">
        <component
          :is="heading"
          class="lab-card__name"
        >
          {{ name }}
        </component>
        <span :class="['lab-card__status', `lab-card__status--${tone}`]">{{ status }}</span>
      </div>
      <p class="lab-card__summary">
        {{ summary }}
      </p>
      <TagList
        :tags="stack"
        label="Stack"
      />
      <a
        v-if="link"
        :href="link"
        class="lab-card__link"
      >{{ linkLabel(link) }}</a>
    </div>
  </article>
</template>

<style scoped>
.lab-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.lab-card__media {
  border-bottom: 1px solid var(--line);
  background: var(--paper);
}

.lab-card__media--image,
.lab-card__media--placeholder {
  aspect-ratio: 16 / 9;
}

.lab-card__media--placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  background: repeating-linear-gradient(135deg, var(--paper) 0 12px, var(--line) 12px 13px);
}

.lab-card__media--diagram {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: var(--surface);
}

.lab-card__image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.lab-card__body {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 10px;
  padding: 20px;
}

.lab-card__top {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 8px 12px;
}

.lab-card__name {
  font-size: 1.5rem;
  overflow-wrap: anywhere;
}

.lab-card__status {
  padding: 5px 8px;
  border-radius: 999px;
  font-family: var(--font-mono);
  font-size: var(--text-label);
  font-weight: 600;
  line-height: 1.2;
}

.lab-card__status--live {
  background: var(--jade-soft);
  color: var(--jade);
}

/* Light amber is never text (D-015), so the amber tag has ink text. */
.lab-card__status--building {
  background: var(--amber-soft);
  color: var(--ink);
}

.lab-card__summary {
  color: var(--muted);
}

.lab-card__link {
  margin-top: auto;
  font-weight: 600;
}
</style>
