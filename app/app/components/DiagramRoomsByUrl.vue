<script setup lang="ts">
// One app for every shop (app/content/work/nz-storefront-from-zero.md): it
// reads the shop from the first part of the URL and picks its theme, header,
// footer and content. Words come from that file. Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const parts = ['Theme', 'Header', 'Footer', 'Content']
const chip = { width: 66, gap: 8 }
const left = (i: number) => 16 + i * (chip.width + chip.gap)
const centre = (i: number) => left(i) + chip.width / 2
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 208"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <rect
      class="diagram__box"
      x="16"
      y="8"
      width="288"
      height="32"
      rx="16"
    />
    <text
      class="diagram__label"
      x="32"
      y="24"
      dy="0.35em"
    >/<tspan class="diagram__accent">shop</tspan>/…</text>
    <text
      class="diagram__label"
      x="288"
      y="24"
      dy="0.35em"
      text-anchor="end"
    >the first part of the URL</text>
    <path
      class="diagram__line"
      d="M160 43V73M156 68l4 5 4-5"
    />
    <rect
      class="diagram__box diagram__box--jade"
      x="16"
      y="76"
      width="288"
      height="50"
      rx="6"
    />
    <text
      class="diagram__strong"
      x="160"
      y="94"
      dy="0.35em"
      text-anchor="middle"
    >One app</text>
    <text
      class="diagram__label"
      x="160"
      y="112"
      dy="0.35em"
      text-anchor="middle"
    >all 5 shops</text>
    <g
      v-for="(part, i) in parts"
      :key="part"
    >
      <path
        class="diagram__line"
        :d="`M160 129V142H${centre(i)}V165M${centre(i) - 4} 160l4 5 4-5`"
      />
      <rect
        class="diagram__box diagram__box--soft"
        :x="left(i)"
        y="168"
        :width="chip.width"
        height="32"
        rx="6"
      />
      <text
        :x="centre(i)"
        y="184"
        dy="0.35em"
        text-anchor="middle"
      >{{ part }}</text>
    </g>
  </svg>
</template>
