<script setup lang="ts">
// The AI pipeline of the "AI dev team" case study (app/content/work/nz-ai-dev-team.md):
// ticket to merge, with at most two AI review fix rounds, and a person doing
// the merge. Words come from that file. Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const steps = ['Ticket', 'Brief', 'Plan', 'Build test-first', 'Pull request', 'AI review', 'Person merges']
const box = { x: 16, width: 192, height: 30, gap: 16 }
const top = (i: number) => 8 + i * (box.height + box.gap)
const middle = (i: number) => top(i) + box.height / 2
const centre = box.x + box.width / 2
const right = box.x + box.width
const build = steps.indexOf('Build test-first')
const review = steps.indexOf('AI review')
const legend = top(steps.length) + 4
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 358"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <g
      v-for="(step, i) in steps"
      :key="step"
    >
      <rect
        :class="['diagram__box', { 'diagram__box--soft': i === steps.length - 1 }]"
        :x="box.x"
        :y="top(i)"
        :width="box.width"
        :height="box.height"
        rx="6"
      />
      <text
        :class="{ diagram__strong: i === steps.length - 1 }"
        :x="centre"
        :y="middle(i)"
        dy="0.35em"
        text-anchor="middle"
      >{{ step }}</text>
      <path
        v-if="i < steps.length - 1"
        class="diagram__line"
        :d="`M${centre} ${top(i) + box.height + 3}V${top(i + 1) - 3}M${centre - 4} ${top(i + 1) - 8}l4 5 4-5`"
      />
    </g>
    <path
      class="diagram__line diagram__line--jade"
      :d="`M${right + 3} ${middle(review)}H${right + 20}V${middle(build)}H${right + 3}m6-5-6 5 6 5`"
    />
    <text
      class="diagram__label"
      :x="right + 28"
      :y="(middle(build) + middle(review)) / 2 - 3"
    >at most two</text>
    <text
      class="diagram__label"
      :x="right + 28"
      :y="(middle(build) + middle(review)) / 2 + 11"
    >fix rounds</text>
    <rect
      class="diagram__box"
      :x="box.x"
      :y="legend"
      width="14"
      height="14"
      rx="3"
    />
    <text
      class="diagram__label"
      :x="box.x + 20"
      :y="legend + 7"
      dy="0.35em"
    >Agent</text>
    <rect
      class="diagram__box diagram__box--soft"
      :x="box.x + 84"
      :y="legend"
      width="14"
      height="14"
      rx="3"
    />
    <text
      class="diagram__label"
      :x="box.x + 104"
      :y="legend + 7"
      dy="0.35em"
    >Person</text>
  </svg>
</template>
