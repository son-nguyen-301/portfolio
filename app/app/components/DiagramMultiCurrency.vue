<script setup lang="ts">
// One budget in many currencies (app/content/work/aspire-multi-currency.md):
// SGD and USD accounts under one shared limit, with a card on each. Words come
// from that file. Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const currencies = ['SGD', 'USD']
const column = { width: 136, gap: 16 }
const left = (i: number) => 16 + i * (column.width + column.gap)
const centre = (i: number) => left(i) + column.width / 2
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 200"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <rect
      class="diagram__box diagram__box--jade"
      x="16"
      y="8"
      width="288"
      height="52"
      rx="6"
    />
    <text
      class="diagram__strong"
      x="160"
      y="28"
      dy="0.35em"
      text-anchor="middle"
    >Budget</text>
    <text
      class="diagram__label"
      x="160"
      y="46"
      dy="0.35em"
      text-anchor="middle"
    >One shared limit across all currencies</text>
    <g
      v-for="(currency, i) in currencies"
      :key="currency"
    >
      <path
        class="diagram__line"
        :d="`M${centre(i)} 63V81M${centre(i) - 4} 76l4 5 4-5`"
      />
      <rect
        class="diagram__box"
        :x="left(i)"
        y="84"
        :width="column.width"
        height="48"
        rx="6"
      />
      <text
        class="diagram__label"
        :x="centre(i)"
        y="100"
        dy="0.35em"
        text-anchor="middle"
      >Account</text>
      <text
        class="diagram__strong"
        :x="centre(i)"
        y="118"
        dy="0.35em"
        text-anchor="middle"
      >{{ currency }}</text>
      <path
        class="diagram__line"
        :d="`M${centre(i)} 135V153M${centre(i) - 4} 148l4 5 4-5`"
      />
      <rect
        class="diagram__box diagram__box--soft"
        :x="left(i)"
        y="156"
        :width="column.width"
        height="36"
        rx="6"
      />
      <text
        :x="centre(i)"
        y="174"
        dy="0.35em"
        text-anchor="middle"
      >Card · {{ currency }}</text>
    </g>
  </svg>
</template>
