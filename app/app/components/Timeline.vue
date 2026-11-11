<script setup lang="ts">
// Career entries for the About and CV pages, newest first as in
// app/content/timeline.yml. Dates show as "Sep 2024 to now". Education, when
// given, comes after the jobs in the same list.
// Values come from app/utils, never from shared/ (D-027). An `import type`
// is removed before the build, so a relative path to shared/ is fine there.
import { formatMonth } from '../utils/dates'
import type { Timeline } from '../../shared/content/schemas'

withDefaults(defineProps<{
  jobs: Timeline['jobs']
  education?: Timeline['education']
  heading?: 'h2' | 'h3'
  // `rows` starts each entry with a thin rule and, from 760 px up, puts the
  // dates in a column beside the rest, as on docs/design/About.dc.html.
  layout?: 'list' | 'rows'
}>(), {
  education: () => [],
  heading: 'h3',
  layout: 'list',
})
</script>

<template>
  <ol
    class="timeline"
    :class="`timeline--${layout}`"
  >
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
    <li
      v-for="school in education"
      :key="`${school.school}-${school.start}`"
      class="timeline__entry timeline__entry--education"
    >
      <p class="timeline__when label">
        <time :datetime="school.start">{{ formatMonth(school.start) }}</time>
        to
        <time :datetime="school.end">{{ formatMonth(school.end) }}</time>
      </p>
      <component
        :is="heading"
        class="timeline__role"
      >
        {{ school.field }}
      </component>
      <p class="timeline__place">
        {{ school.school }}
      </p>
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

/* Rows: each entry starts with a thin rule, with no rule on the left. */
.timeline--rows {
  gap: 0;
}

.timeline--rows .timeline__entry {
  padding: 24px 0;
  border-top: 1px solid var(--line);
  border-left: 0;
}

.timeline--rows .timeline__points {
  color: var(--muted);
}

/* From 760 px up the dates sit in a 200 px column, the rest beside them. */
@media (min-width: 760px) {
  .timeline--rows .timeline__entry {
    display: grid;
    grid-template-columns: minmax(0, 200px) minmax(0, 1fr);
    align-content: start;
    gap: 4px 24px;
  }

  .timeline--rows .timeline__when {
    grid-row: 1;
    grid-column: 1;
  }

  .timeline--rows .timeline__entry > :not(.timeline__when) {
    grid-column: 2;
  }

  .timeline--rows .timeline__role {
    font-size: 1.375rem;
  }
}
</style>
