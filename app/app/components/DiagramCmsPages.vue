<script setup lang="ts">
// Pages from the CMS (app/content/work/paymentwall-terminal3.md): a Strapi page
// entry (slug, components, content) turned into Vue components on the page.
// Words come from that file. Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

// The fields of a page entry, as chips: x and width.
const fields = [
  { name: 'slug', x: 32, width: 56 },
  { name: 'components', x: 96, width: 100 },
  { name: 'content', x: 204, width: 84 },
]
const blocks = [0, 1, 2].map(i => 160 + i * 34)
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 276"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <rect
      class="diagram__box"
      x="16"
      y="8"
      width="288"
      height="76"
      rx="6"
    />
    <text
      class="diagram__strong"
      x="32"
      y="30"
      dy="0.35em"
    >Strapi page entry</text>
    <g
      v-for="field in fields"
      :key="field.name"
    >
      <rect
        class="diagram__box diagram__box--soft"
        :x="field.x"
        y="48"
        :width="field.width"
        height="24"
        rx="12"
      />
      <text
        class="diagram__label"
        :x="field.x + field.width / 2"
        y="60"
        dy="0.35em"
        text-anchor="middle"
      >{{ field.name }}</text>
    </g>
    <path
      class="diagram__line"
      d="M160 87V121M156 116l4 5 4-5"
    />
    <text
      class="diagram__label"
      x="172"
      y="104"
      dy="0.35em"
    >turned into</text>
    <rect
      class="diagram__box diagram__box--jade"
      x="16"
      y="124"
      width="288"
      height="144"
      rx="6"
    />
    <text
      class="diagram__label"
      x="32"
      y="142"
      dy="0.35em"
    >Page</text>
    <g
      v-for="y in blocks"
      :key="y"
    >
      <rect
        class="diagram__box diagram__box--soft"
        x="32"
        :y="y"
        width="256"
        height="26"
        rx="4"
      />
      <text
        x="160"
        :y="y + 13"
        dy="0.35em"
        text-anchor="middle"
      >Vue component</text>
    </g>
  </svg>
</template>
