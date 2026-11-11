<script setup lang="ts">
// The work list (PF-012, docs/design/Work.dc.html): a short intro and every
// case study as a card, in `order`, then links to the Lab and the earlier
// projects. The cards read only their own fields (useWorkCards), so no case
// study body is in this page's data. The intro and the line about the Lab come
// from profile.yml (`workList`); the label, the headings and the link labels
// are written here and hold no fact (D-024).
const { data: profile } = await useProfile('workList')
const { data: work } = await useWorkCards()

useSeoMeta({
  title: 'Work',
  description: () => profile.value?.workList.intro,
})
</script>

<template>
  <div class="work-list">
    <div class="work-list__head">
      <p class="label">
        Work
      </p>
      <h1>Case studies</h1>
      <p
        v-if="profile"
        class="lead"
      >
        {{ profile.workList.intro }}
      </p>
    </div>

    <ul
      class="work-list__cards"
      aria-label="Case studies"
    >
      <li
        v-for="study in work"
        :key="study.path"
      >
        <WorkCard
          :to="study.path"
          :title="study.title"
          :summary="study.summary"
          :stack="study.stack"
          :metric="study.cardMetric"
          :period="study.period"
          :client="study.client"
          heading="h2"
        />
      </li>
    </ul>

    <section
      class="work-list__more"
      aria-labelledby="work-more"
    >
      <div class="work-list__more-text">
        <h2 id="work-more">
          Smaller and older projects
        </h2>
        <p v-if="profile">
          {{ profile.workList.more }}
        </p>
      </div>
      <div class="work-list__more-links">
        <NuxtLink to="/lab">
          Lab →
        </NuxtLink>
        <NuxtLink to="/about#earlier">
          Earlier projects →
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<style scoped>
.work-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
  padding-bottom: 64px;
}

.work-list__head {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 680px;
}

.work-list__cards {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.work-list__cards > li {
  display: flex;
}

.work-list__cards > li > * {
  flex: 1;
}

.work-list__more {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 28px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.work-list__more-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.work-list__more-text h2 {
  font-size: 1.5rem;
}

.work-list__more-text p {
  color: var(--muted);
}

.work-list__more-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-weight: 600;
}

@media (min-width: 760px) {
  .work-list {
    padding-bottom: 96px;
  }

  .work-list__cards {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  /* The cards here are two to a row, so their titles are larger than on the
     home page (docs/design/Work.dc.html). */
  .work-list__cards :deep(.work-card__title) {
    font-size: 1.4375rem;
  }
}
</style>
