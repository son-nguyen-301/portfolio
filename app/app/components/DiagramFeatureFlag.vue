<script setup lang="ts">
// The redesign behind a feature flag (app/content/work/aspire-redesign.md):
// real customers keep the old screens, chosen businesses get the new design in
// light and dark. Words come from that file. Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const sides = [
  { who: 'Real customers', what: 'Old screens', note: '', fresh: false },
  { who: 'Chosen businesses', what: 'New design', note: 'Light and dark', fresh: true },
]
const column = { width: 136, gap: 16 }
const left = (i: number) => 16 + i * (column.width + column.gap)
const centre = (i: number) => left(i) + column.width / 2
// The content lines of a screen sketch: x offset, y, width.
const lines = [[12, 40, 72], [12, 54, 104], [12, 68, 88]] as const
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 244"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <rect
      class="diagram__box diagram__box--jade"
      x="100"
      y="8"
      width="120"
      height="30"
      rx="15"
    />
    <text
      class="diagram__strong"
      x="160"
      y="23"
      dy="0.35em"
      text-anchor="middle"
    >Feature flag</text>
    <path
      class="diagram__line"
      :d="`M160 41V52H${centre(0)}V62M${centre(0) - 4} 57l4 5 4-5M160 52H${centre(1)}V62M${centre(1) - 4} 57l4 5 4-5`"
    />
    <g
      v-for="(side, i) in sides"
      :key="side.what"
    >
      <text
        class="diagram__label"
        :x="centre(i)"
        y="76"
        dy="0.35em"
        text-anchor="middle"
      >{{ side.who }}</text>
      <rect
        :class="['diagram__box', { 'diagram__box--jade': side.fresh }]"
        :x="left(i)"
        y="88"
        :width="column.width"
        height="92"
        rx="6"
      />
      <rect
        :class="side.fresh ? 'diagram__bar diagram__bar--jade' : 'diagram__bar'"
        :x="left(i) + 1"
        y="89"
        :width="column.width - 2"
        height="14"
        rx="5"
      />
      <rect
        v-for="([x, y, width], j) in lines"
        :key="j"
        :class="side.fresh ? 'diagram__bar diagram__bar--soft' : 'diagram__bar'"
        :x="left(i) + x"
        :y="88 + y"
        :width="width"
        height="8"
        rx="4"
      />
      <text
        class="diagram__strong"
        :x="centre(i)"
        y="200"
        dy="0.35em"
        text-anchor="middle"
      >{{ side.what }}</text>
      <text
        v-if="side.note"
        class="diagram__label"
        :x="centre(i)"
        y="220"
        dy="0.35em"
        text-anchor="middle"
      >{{ side.note }}</text>
    </g>
  </svg>
</template>
