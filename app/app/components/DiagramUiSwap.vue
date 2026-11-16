<script setup lang="ts">
// The UI library swap (app/content/work/nz-storefront-speed-ui-swap.md): pages
// use our own component layer; behind it, old library components are swapped
// for new ones one at a time, in about 60 small pull requests, each step
// checked against screenshots. Words come from that file.
// Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const libraries = [
  { name: 'Old library', fresh: false },
  { name: 'New library', fresh: true },
]
const column = { width: 136, gap: 16, top: 110, height: 40 }
const left = (i: number) => 16 + i * (column.width + column.gap)
const centre = (i: number) => left(i) + column.width / 2
const bottom = column.top + column.height
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
      class="diagram__box"
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
    >Pages</text>
    <path
      class="diagram__line"
      d="M160 41V53M156 48l4 5 4-5"
    />
    <rect
      class="diagram__box diagram__box--jade"
      x="16"
      y="56"
      width="288"
      height="30"
      rx="6"
    />
    <text
      class="diagram__strong"
      x="160"
      y="71"
      dy="0.35em"
      text-anchor="middle"
    >Our own component layer</text>
    <path
      class="diagram__line"
      :d="`M160 89V98H${centre(0)}V${column.top - 3}M${centre(0) - 4} ${column.top - 8}l4 5 4-5M160 98H${centre(1)}V${column.top - 3}M${centre(1) - 4} ${column.top - 8}l4 5 4-5`"
    />
    <g
      v-for="(library, i) in libraries"
      :key="library.name"
    >
      <rect
        :class="['diagram__box', { 'diagram__box--soft diagram__box--jade': library.fresh }]"
        :x="left(i)"
        :y="column.top"
        :width="column.width"
        :height="column.height"
        rx="6"
      />
      <text
        :x="centre(i)"
        :y="column.top + column.height / 2"
        dy="0.35em"
        text-anchor="middle"
      >{{ library.name }}</text>
    </g>
    <path
      class="diagram__line diagram__line--jade"
      :d="`M${centre(0)} ${bottom + 3}V170H${centre(1)}V${bottom + 3}m-4 5 4-5 4 5`"
    />
    <text
      class="diagram__label"
      x="160"
      y="184"
      dy="0.35em"
      text-anchor="middle"
    >Swapped one at a time</text>
    <text
      x="160"
      y="210"
      dy="0.35em"
      text-anchor="middle"
    >About 60 small pull requests</text>
    <text
      class="diagram__label"
      x="160"
      y="230"
      dy="0.35em"
      text-anchor="middle"
    >Each step checked against screenshots</text>
  </svg>
</template>
