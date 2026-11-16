<script setup lang="ts">
// hydra-claude on the Lab page (app/content/lab/hydra-claude.yml): Claude Code
// saves corrections, rules and decisions to a memory for each repo, and the
// memory brings them back when they matter. Words come from that file's
// summary. Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const saved = ['Corrections', 'Rules', 'Decisions']
const chip = { width: 88, gap: 8, top: 80, height: 30 }
const left = (i: number) => 160 - (3 * chip.width + 2 * chip.gap) / 2 + i * (chip.width + chip.gap)
const centre = (i: number) => left(i) + chip.width / 2
const first = centre(0)
const last = centre(saved.length - 1)
const bottom = chip.top + chip.height
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 246"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <rect
      class="diagram__box"
      x="80"
      y="8"
      width="160"
      height="30"
      rx="6"
    />
    <text
      x="160"
      y="23"
      dy="0.35em"
      text-anchor="middle"
    >Claude Code</text>
    <path
      class="diagram__line"
      :d="`M160 41V58M${first} 58H${last}`"
    />
    <text
      class="diagram__label"
      x="168"
      y="49"
      dy="0.35em"
    >saves</text>
    <g
      v-for="(item, i) in saved"
      :key="item"
    >
      <path
        class="diagram__line"
        :d="`M${centre(i)} 58V${chip.top - 3}M${centre(i) - 4} ${chip.top - 8}l4 5 4-5`"
      />
      <rect
        class="diagram__box diagram__box--soft"
        :x="left(i)"
        :y="chip.top"
        :width="chip.width"
        :height="chip.height"
        rx="6"
      />
      <text
        :x="centre(i)"
        :y="chip.top + chip.height / 2"
        dy="0.35em"
        text-anchor="middle"
      >{{ item }}</text>
      <path
        class="diagram__line"
        :d="`M${centre(i)} ${bottom + 3}V124`"
      />
    </g>
    <path
      class="diagram__line"
      :d="`M${first} 124H${last}M160 124V141M156 136l4 5 4-5`"
    />
    <rect
      class="diagram__box diagram__box--soft diagram__box--jade"
      x="60"
      y="144"
      width="200"
      height="30"
      rx="6"
    />
    <text
      class="diagram__strong"
      x="160"
      y="159"
      dy="0.35em"
      text-anchor="middle"
    >Memory for each repo</text>
    <path
      class="diagram__line diagram__line--jade"
      d="M160 177V205M156 200l4 5 4-5"
    />
    <text
      class="diagram__label"
      x="168"
      y="184"
      dy="0.35em"
    >brings them back</text>
    <text
      class="diagram__label"
      x="168"
      y="198"
      dy="0.35em"
    >when they matter</text>
    <rect
      class="diagram__box"
      x="80"
      y="208"
      width="160"
      height="30"
      rx="6"
    />
    <text
      x="160"
      y="223"
      dy="0.35em"
      text-anchor="middle"
    >Claude Code</text>
  </svg>
</template>
