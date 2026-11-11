<script setup lang="ts">
// Career entries for the About and CV pages, newest first as in
// app/content/timeline.yml. Dates show as "Sep 2024 to now".
// Values come from app/utils, never from shared/ (D-027). An `import type`
// is removed before the build, so a relative path to shared/ is fine there.
import { formatMonth } from '../utils/dates'
import type { Timeline } from '../../shared/content/schemas'

withDefaults(defineProps<{
  jobs: Timeline['jobs']
  heading?: 'h2' | 'h3'
}>(), {
  heading: 'h3',
})
</script>

<template>
  <ol class="timeline">
    <li
      v-for="job in jobs"
      :key="`${job.company}-${job.start}`"
      class="timeline__entry"
    >
      <p class="timeline__when label">
        <time :datetime="job.start">{{ formatMonth(job.start) }}</time>
        to
        <time
          v-if="job.end"
          :datetime="job.end"
        >{{ formatMonth(job.end) }}</time>
        <span v-else>now</span>
      </p>
      <component
        :is="heading"
        class="timeline__role"
      >
        {{ job.role }}
      </component>
      <p class="timeline__place">
        {{ job.company }} · {{ job.location }}
      </p>
      <p
        v-if="job.type"
        class="timeline__type small"
      >
        {{ job.type }}
      </p>
      <ul class="timeline__points">
        <li
          v-for="point in job.points"
          :key="point"
        >
          {{ point }}
        </li>
      </ul>
    </li>
  </ol>
</template>

<style scoped>
.timeline {
  display: flex;
  flex-direction: column;
  gap: 28px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.timeline__entry {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 20px;
  border-left: 2px solid var(--line);
}

.timeline__entry:first-child {
  border-left-color: var(--jade);
}

.timeline__role {
  font-size: 1.25rem;
}

.timeline__place {
  font-weight: 500;
}

.timeline__type {
  color: var(--muted);
}

.timeline__points {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-width: var(--measure);
  margin-top: 8px;
  padding-left: 1.1em;
}
</style>
