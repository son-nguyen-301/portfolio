<script setup lang="ts">
// The Lab page (PF-017, docs/design/Lab.dc.html): every side project from
// app/content/lab/ as a card, in `order`. The label and the heading are written
// here and hold no fact (D-024). The design's intro sentence is left out: it
// makes claims that are not in content (D-034).
const { data: projects } = await useLabProjects()

useSeoMeta({
  title: 'Lab',
  description: () => labDescription((projects.value ?? []).map(project => project.name)),
})
</script>

<template>
  <div class="lab">
    <div class="lab__head">
      <p class="label">
        Lab
      </p>
      <h1>Side projects</h1>
    </div>

    <ul
      class="lab__cards"
      aria-label="Side projects"
    >
      <li
        v-for="project in projects"
        :key="project.name"
      >
        <LabCard
          :name="project.name"
          :summary="project.summary"
          :status="project.status"
          :stack="project.stack"
          :link="project.link"
          :media="project.media"
          heading="h2"
        />
      </li>
    </ul>
  </div>
</template>

<style scoped>
.lab {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-bottom: 64px;
}

.lab__head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 680px;
}

.lab__cards {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.lab__cards > li {
  display: flex;
}

.lab__cards > li > * {
  flex: 1;
}

@media (min-width: 760px) {
  .lab {
    padding-bottom: 96px;
  }

  .lab__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
