<script setup lang="ts">
// Homereel on the Lab page (app/content/lab/homereel.yml): the home server
// sends movies and shows to the app on Google TV and on an Android phone.
// It shows the server and the two apps only, never the parts behind the
// server (the rule in that file). Words come from that file's name and
// summary. Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const apps = ['Google TV', 'Android phone']
const app = { width: 140, top: 88, height: 50 }
const left = (i: number) => 12 + i * (app.width + 16)
const centre = (i: number) => left(i) + app.width / 2
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 146"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <rect
      class="diagram__box diagram__box--jade"
      x="80"
      y="8"
      width="160"
      height="32"
      rx="6"
    />
    <text
      class="diagram__strong"
      x="160"
      y="24"
      dy="0.35em"
      text-anchor="middle"
    >Home server</text>
    <path
      class="diagram__line"
      :d="`M160 43V66M${centre(0)} 66H${centre(apps.length - 1)}`"
    />
    <text
      class="diagram__label"
      x="168"
      y="54"
      dy="0.35em"
    >movies and shows</text>
    <g
      v-for="(name, i) in apps"
      :key="name"
    >
      <path
        class="diagram__line"
        :d="`M${centre(i)} 66V${app.top - 3}M${centre(i) - 4} ${app.top - 8}l4 5 4-5`"
      />
      <rect
        class="diagram__box diagram__box--soft"
        :x="left(i)"
        :y="app.top"
        :width="app.width"
        :height="app.height"
        rx="6"
      />
      <text
        class="diagram__strong"
        :x="centre(i)"
        :y="app.top + 17"
        dy="0.35em"
        text-anchor="middle"
      >Homereel</text>
      <text
        class="diagram__label"
        :x="centre(i)"
        :y="app.top + 34"
        dy="0.35em"
        text-anchor="middle"
      >{{ name }}</text>
    </g>
  </svg>
</template>
