<script setup lang="ts">
// The UI library CSS before and after (app/content/work/nz-storefront-speed-ui-swap.md):
// two bars to scale, 419,729 bytes and 145,215 bytes (−65%), from loading only
// the 20 UI components the site uses. Words and numbers come from that file.
// Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

// The longest bar leaves room for its byte count on the right.
const full = { x: 16, width: 190 }
const before = 419_729
const after = 145_215
const rows = [
  { name: 'Before', bytes: before, top: 36, fresh: false },
  { name: 'Only the 20 UI components we use', bytes: after, top: 92, fresh: true },
]
const bar = (bytes: number) => Math.round((full.width * bytes) / before * 10) / 10
const cut = `−${Math.round((1 - after / before) * 100)}%`
const bytes = (value: number) => `${value.toLocaleString('en-US')} bytes`
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 148"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <text
      class="diagram__strong"
      :x="full.x"
      y="16"
      dy="0.35em"
    >UI library CSS</text>
    <g
      v-for="row in rows"
      :key="row.name"
    >
      <text
        :x="full.x"
        :y="row.top + 8"
        dy="0.35em"
      >{{ row.name }}</text>
      <rect
        :class="['diagram__bar', row.fresh ? 'diagram__bar--jade' : 'diagram__bar--muted']"
        :x="full.x"
        :y="row.top + 20"
        :width="bar(row.bytes)"
        height="20"
        rx="4"
      />
      <text
        class="diagram__label"
        :x="full.x + bar(row.bytes) + 8"
        :y="row.top + 30"
        dy="0.35em"
      >{{ bytes(row.bytes) }}</text>
    </g>
    <text
      class="diagram__strong diagram__accent"
      x="304"
      :y="rows[1]!.top + 30"
      dy="0.35em"
      text-anchor="end"
    >{{ cut }}</text>
  </svg>
</template>
