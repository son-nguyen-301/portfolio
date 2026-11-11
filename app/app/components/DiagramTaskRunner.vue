<script setup lang="ts">
// The GitHub task runner on the Lab page (app/content/lab/task-runner.yml):
// issue to merge, a second-agent review of up to 3 rounds, and a label that
// starts the next run. Words come from that file. Styles: app/assets/css/diagrams.css.
defineProps<{ title: string }>()

const steps = ['Issue', 'Claim', 'Build', 'Pull request', 'Second-agent review', 'Merge', 'Label starts the next run']
const box = { x: 36, width: 204, height: 30, gap: 16 }
const top = (i: number) => 8 + i * (box.height + box.gap)
const middle = (i: number) => top(i) + box.height / 2
const centre = box.x + box.width / 2
const right = box.x + box.width
const build = steps.indexOf('Build')
const review = steps.indexOf('Second-agent review')
const last = steps.length - 1
</script>

<template>
  <svg
    class="diagram"
    role="img"
    viewBox="0 0 320 322"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>{{ title }}</title>
    <g
      v-for="(step, i) in steps"
      :key="step"
    >
      <rect
        :class="['diagram__box', { 'diagram__box--soft': i === review }]"
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
      :d="`M${right + 3} ${middle(review)}H${right + 16}V${middle(build)}H${right + 3}m6-5-6 5 6 5`"
    />
    <text
      class="diagram__label"
      :x="right + 22"
      :y="(middle(build) + middle(review)) / 2 - 3"
    >up to</text>
    <text
      class="diagram__label"
      :x="right + 22"
      :y="(middle(build) + middle(review)) / 2 + 11"
    >3 rounds</text>
    <path
      class="diagram__line diagram__line--jade"
      :d="`M${box.x - 3} ${middle(last)}H${box.x - 18}V${middle(0)}H${box.x - 3}m-6-5 6 5-6 5`"
    />
  </svg>
</template>
