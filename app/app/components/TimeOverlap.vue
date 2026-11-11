<script setup lang="ts">
// The time overlap clock (docs/design.md, Time overlap clock): Son's time, the
// visitor's time, a 24-hour bar in the visitor's time with Son's hours (jade)
// and the visitor's 9-to-5 (amber stripes), and one sentence. On phones it is
// one line.
//
// The built page can't know the visitor's zone, so the server HTML is the
// neutral version: Son's city, UTC offset and hours. After mount the clock
// fills in the visitor's details and updates every 30 seconds. Both versions
// have the same parts and the same height, so nothing moves when it fills in.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { formatClock, useTimeOverlap } from '../composables/useTimeOverlap'
import type { TimeOverlap } from '../composables/useTimeOverlap'
import {
  barParts,
  clockAt,
  describeOverlap,
  hourAt,
  offsetText,
  shortOverlapText,
  visitorOffsetAt,
  workHoursText,
  zoneCity,
} from '../utils/overlap'

const props = defineProps<{
  // Son's city, for example "Hanoi" (the first part of profile.location).
  city: string
  // profile.utcOffset
  utcOffset: number
  // profile.hours.start and profile.hours.end, clock hours in Son's time.
  start: number
  end: number
}>()

const sonHours = `${formatClock(props.start)} to ${formatClock(props.end)}`
const neutral = `${props.city}, ${offsetText(props.utcOffset)} · ${sonHours}`
// Son's hours in Son's own time: the bar in the server HTML.
const sonOwn = useTimeOverlap(props.utcOffset, props.start, props.end, props.utcOffset)

const now = ref<Date>()
const zone = ref('')
let timer: ReturnType<typeof setInterval> | undefined

function tick() {
  now.value = new Date()
}

onMounted(() => {
  try {
    zone.value = zoneCity(Intl.DateTimeFormat().resolvedOptions().timeZone)
  }
  catch {
    zone.value = ''
  }
  tick()
  timer = setInterval(tick, 30_000)
})

onBeforeUnmount(() => clearInterval(timer))

const visitorOffset = computed(() => (now.value ? visitorOffsetAt(now.value) : undefined))

// Undefined until mount, and if the browser gives an offset outside -12 to 14.
const overlap = computed<TimeOverlap | undefined>(() => {
  if (visitorOffset.value === undefined) return undefined
  try {
    return useTimeOverlap(visitorOffset.value, props.start, props.end, props.utcOffset)
  }
  catch {
    return undefined
  }
})

const ready = computed(() => !!overlap.value)
const text = computed(() => (overlap.value && visitorOffset.value !== undefined
  ? describeOverlap(overlap.value, visitorOffset.value, props.utcOffset)
  : undefined))

const sonNow = computed(() => (now.value && ready.value ? clockAt(now.value, props.utcOffset) : offsetText(props.utcOffset)))
const visitorNow = computed(() => (now.value && visitorOffset.value !== undefined ? clockAt(now.value, visitorOffset.value) : '00:00'))
const sonParts = computed(() => barParts(overlap.value?.son ?? sonOwn.son))
const visitorParts = computed(() => (overlap.value ? barParts(overlap.value.visitor) : []))
const nowMark = computed(() => (now.value && visitorOffset.value !== undefined && ready.value
  ? Math.round((hourAt(now.value, visitorOffset.value) / 24) * 100 * 100) / 100
  : undefined))
const shortText = computed(() => (text.value ? shortOverlapText(text.value) : `${sonHours} ${props.city}`))

// The longest sentence the clock can show. It sits under the real one,
// invisible, so the sentence box is the same height before and after mount at
// any width.
const longest = `Our work days don't overlap. I send a written update before your day starts, and I can take calls at 00:00 your time.`

const style = (part: { left: number, width: number }) => ({ left: `${part.left}%`, width: `${part.width}%` })
</script>

<template>
  <aside
    class="time-overlap"
    aria-label="Shared working hours"
    :data-state="ready ? 'ready' : 'neutral'"
  >
    <div class="time-overlap__full">
      <div class="time-overlap__clocks">
        <div class="time-overlap__clock">
          <p class="label">
            {{ ready ? `${city} now` : city }}
          </p>
          <p class="time-overlap__time">
            {{ sonNow }}
          </p>
        </div>
        <div
          class="time-overlap__clock time-overlap__clock--you"
          :class="{ 'time-overlap__pending': !ready }"
          :aria-hidden="ready ? undefined : 'true'"
        >
          <p class="label">
            Your time{{ zone ? ` · ${zone}` : '' }}
          </p>
          <p class="time-overlap__time">
            {{ visitorNow }}
          </p>
        </div>
      </div>

      <div class="time-overlap__scale-wrap">
        <div
          class="time-overlap__bar"
          aria-hidden="true"
        >
          <span
            v-for="(part, i) in sonParts"
            :key="`son-${i}`"
            class="time-overlap__son"
            :style="style(part)"
          />
          <span
            v-for="(part, i) in visitorParts"
            :key="`you-${i}`"
            class="time-overlap__you"
            :style="style(part)"
          />
          <span
            v-if="nowMark !== undefined"
            class="time-overlap__now"
            :style="{ left: `${nowMark}%` }"
          />
        </div>
        <div
          class="time-overlap__scale"
          aria-hidden="true"
        >
          <span>00</span><span>06</span><span>12</span><span>18</span><span>24</span>
        </div>
      </div>

      <ul class="time-overlap__legend">
        <li>
          <span
            class="time-overlap__key time-overlap__key--son"
            aria-hidden="true"
          />My hours, {{ sonHours }} {{ city }}
        </li>
        <li
          :class="{ 'time-overlap__pending': !ready }"
          :aria-hidden="ready ? undefined : 'true'"
        >
          <span
            class="time-overlap__key time-overlap__key--you"
            aria-hidden="true"
          />Your 9 to 5
        </li>
      </ul>

      <div class="time-overlap__sentence">
        <p
          class="time-overlap__sizer"
          aria-hidden="true"
        >
          {{ longest }}
        </p>
        <p v-if="!text">
          {{ neutral }}
        </p>
        <p v-else-if="text.kind === 'same'">
          We are in the same time zone.
        </p>
        <p v-else-if="text.kind === 'shared'">
          We share <strong>{{ workHoursText(text.hours) }}</strong> each weekday: {{ text.ranges }} your time.
        </p>
        <p v-else>
          Our work days don't overlap. I send a written update before your day starts, and I can take calls at {{ text.callAt }} your time.
        </p>
      </div>
    </div>

    <div class="time-overlap__line">
      <div class="time-overlap__line-main">
        <p class="label">
          {{ ready ? 'Shared work hours' : 'My hours' }}
        </p>
        <p class="time-overlap__line-value">
          {{ shortText }}
        </p>
      </div>
      <p class="time-overlap__line-clock">
        {{ city }}<br>{{ sonNow }}
      </p>
    </div>
  </aside>
</template>

<style scoped>
.time-overlap {
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.time-overlap__full {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 22px;
}

.time-overlap__clocks {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.time-overlap__clock {
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.time-overlap p {
  margin: 0;
}

.time-overlap__clock .label {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.time-overlap__clock--you {
  text-align: right;
}

.time-overlap__time {
  font-family: var(--font-mono);
  font-size: 1.75rem;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
  white-space: nowrap;
}

/* Parts that only make sense once the visitor's time is known. They keep their
   space in the server HTML, so the clock does not grow when it fills in. */
.time-overlap__pending {
  visibility: hidden;
}

.time-overlap__scale-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-overlap__bar {
  position: relative;
  height: 28px;
  border: 1px solid var(--line);
  border-radius: 6px;
  background: var(--paper);
  overflow: hidden;
}

.time-overlap__bar span {
  position: absolute;
  top: 0;
  bottom: 0;
}

.time-overlap__son {
  background: var(--jade-soft);
}

.time-overlap__you {
  box-sizing: border-box;
  border-inline: 2px solid var(--amber);
  background: repeating-linear-gradient(45deg, transparent 0 5px, var(--amber-soft) 5px 10px);
}

.time-overlap__now {
  width: 2px;
  margin-left: -1px;
  background: var(--ink);
}

.time-overlap__scale {
  display: flex;
  justify-content: space-between;
  font-family: var(--font-mono);
  font-size: 0.6875rem;
  color: var(--muted);
}

.time-overlap__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.8125rem;
  color: var(--muted);
}

.time-overlap__legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.time-overlap__key {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.time-overlap__key--son {
  border: 1px solid var(--jade);
  background: var(--jade-soft);
}

.time-overlap__key--you {
  border: 1px solid var(--amber);
  background: var(--amber-soft);
}

/* The sentence and the invisible longest sentence share one grid cell, so
   the cell is always as tall as the longest one. */
.time-overlap__sentence {
  display: grid;
  font-size: 0.9375rem;
}

.time-overlap__sentence > p {
  grid-area: 1 / 1;
  margin: 0;
}

.time-overlap__sizer {
  visibility: hidden;
}

.time-overlap__line {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
}

.time-overlap__line-main {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.time-overlap__line-value {
  font-family: var(--font-mono);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.time-overlap__line-clock {
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 0.8125rem;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
  text-align: right;
}

/* Phones: one line (docs/design.md). Rows stack below 720 px. */
@media (max-width: 719px) {
  .time-overlap__full {
    display: none;
  }

  .time-overlap__line {
    display: flex;
  }
}
</style>
