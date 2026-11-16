<script setup lang="ts">
// Looper on the Lab page (app/content/lab/looper.yml): idea to live app, then
// it keeps fixing it after launch. Claude Code does the building, and risk
// levels decide what it may do alone. Words come from that file's summary.
// Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const steps = ['Idea', 'Spec', 'Board', 'Build', 'Deploy', 'Watch', 'Fix']
const box = { x: 36, width: 116, height: 30, gap: 16 }
const top = (i: number) => 8 + i * (box.height + box.gap)
const middle = (i: number) => top(i) + box.height / 2
const centre = box.x + box.width / 2
const right = box.x + box.width
const build = steps.indexOf('Build')
const watch = steps.indexOf('Watch')
const last = steps.length - 1
// The column beside the steps: who builds, and what decides what it may do.
// A line on its right joins Risk levels to Claude Code.
const side = { x: 176, width: 136 }
const join = side.x + side.width - 14
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 344"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <g
      v-for="(step, i) in steps"
      :key="step"
    >
      <rect
        :class="['diagram__box', { 'diagram__box--jade': i === build }]"
        :x="box.x"
        :y="top(i)"
        :width="box.width"
        :height="box.height"
        rx="6"
      />
      <text
        :x="centre"
        :y="middle(i)"
        dy="0.35em"
        text-anchor="middle"
      >{{ step }}</text>
      <path
        v-if="i < last"
        class="diagram__line"
        :d="`M${centre} ${top(i) + box.height + 3}V${top(i + 1) - 3}M${centre - 4} ${top(i + 1) - 8}l4 5 4-5`"
      />
    </g>
    <path
      class="diagram__line diagram__line--jade"
      :d="`M${box.x - 3} ${middle(last)}H${box.x - 18}V${middle(build)}H${box.x - 3}m-6-5 6 5-6 5`"
    />
    <text
      class="diagram__label"
      :x="box.x - 18"
      :y="top(last) + box.height + 14"
      dy="0.35em"
    >keeps fixing after launch</text>
    <path
      class="diagram__line"
      :d="`M${right + 3} ${middle(build)}H${side.x - 3}`"
    />
    <rect
      class="diagram__box diagram__box--soft diagram__box--jade"
      :x="side.x"
      :y="top(build)"
      :width="side.width"
      :height="box.height"
      rx="6"
    />
    <text
      class="diagram__strong"
      :x="side.x + side.width / 2"
      :y="middle(build)"
      dy="0.35em"
      text-anchor="middle"
    >Claude Code</text>
    <text
      class="diagram__label"
      :x="side.x"
      :y="top(build) + box.height + 14"
      dy="0.35em"
    >does the building</text>
    <path
      class="diagram__line"
      :d="`M${join} ${top(build) + box.height + 3}V${top(watch) - 3}`"
    />
    <rect
      class="diagram__box"
      :x="side.x"
      :y="top(watch)"
      :width="side.width"
      :height="box.height"
      rx="6"
    />
    <text
      :x="side.x + side.width / 2"
      :y="middle(watch)"
      dy="0.35em"
      text-anchor="middle"
    >Risk levels</text>
    <text
      class="diagram__label"
      :x="side.x"
      :y="top(watch) + box.height + 14"
      dy="0.35em"
    >decide what it</text>
    <text
      class="diagram__label"
      :x="side.x"
      :y="top(watch) + box.height + 28"
      dy="0.35em"
    >may do alone</text>
  </svg>
</template>
