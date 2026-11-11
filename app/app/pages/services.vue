<script setup lang="ts">
// The services page (PF-015, docs/design/Services.dc.html): the intro with the
// pricing line, the services under their groups (Frontend, AI, Lead), each
// with links to the case studies that prove it, how a project starts, the AI
// rules, a note for people hiring full-time, and the contact block.
//
// Every fact comes from app/content: services.yml (intro, groups, services),
// profile.yml (pricing, steps, AI rules, roles, UTC offset) and the case study
// titles. The labels, headings and link labels written here hold no fact
// (D-024).
//
// The profile fields are named one by one, and never `email` or `booking`:
// ContactBlock gets those after mount, outside Upwork mode (D-021). So the
// page needs no Upwork mode switch of its own.
const { data: services } = await useServices()
const { data: profile } = await useProfile('pricing', 'howIWork', 'aiRules', 'roles', 'utcOffset')
const { data: studies } = await useWorkNav()
const site = useSiteProfile()

const groups = computed(() => {
  if (!services.value) return []
  return serviceGroups(services.value.groups, services.value.items).map(group => ({
    ...group,
    items: group.items.map(item => ({ ...item, links: proofLinks(item.proof, studies.value ?? []) })),
  }))
})

// "Senior Frontend Engineer (Vue and Nuxt), Frontend Lead, or Full-stack
// Engineer (frontend-heavy, Nuxt and Node). Remote, from UTC+7."
const roles = computed(() => (profile.value ? `${orList(profile.value.roles)}. Remote, from ${offsetText(profile.value.utcOffset)}.` : ''))

// "01", "02", ...
const step = (i: number) => String(i + 1).padStart(2, '0')

useSeoMeta({
  title: 'Services',
  description: () => (services.value && profile.value ? `${services.value.intro} ${profile.value.pricing}` : undefined),
})
</script>

<template>
  <div
    v-if="services && profile"
    class="services"
  >
    <div class="services__head">
      <p class="label">
        Services
      </p>
      <h1>Vue and Nuxt work, from a fix to a full app</h1>
      <p class="lead">
        {{ services.intro }} {{ profile.pricing }}
      </p>
    </div>

    <section
      class="services__groups"
      aria-label="Services"
    >
      <div
        v-for="group in groups"
        :key="group.name"
        class="services__group"
        :data-group="group.name"
      >
        <div class="services__group-head">
          <h2 class="label services__group-name">
            {{ group.name }}
          </h2>
          <p class="services__muted small">
            {{ group.note }}
          </p>
        </div>
        <ul class="services__items">
          <li
            v-for="item in group.items"
            :key="item.id"
            class="services__item"
            :data-service="item.id"
          >
            <h3 class="services__title">
              {{ item.title }}
            </h3>
            <p class="services__muted services__summary">
              {{ item.summary }}
            </p>
            <div class="small services__proof">
              <p
                :id="`proof-${item.id}`"
                class="services__proof-label"
              >
                Proof:
              </p>
              <ul
                class="services__proof-links"
                :aria-labelledby="`proof-${item.id}`"
              >
                <li
                  v-for="link in item.links"
                  :key="link.path"
                >
                  <NuxtLink :to="link.path">
                    {{ link.title }}
                  </NuxtLink>
                </li>
              </ul>
            </div>
          </li>
        </ul>
      </div>
    </section>

    <section
      class="services__section"
      aria-labelledby="services-how"
      data-section="how"
    >
      <div class="services__section-head">
        <p class="label">
          How a project starts
        </p>
        <h2 id="services-how">
          Clear steps, written updates
        </h2>
      </div>
      <ol class="services__steps">
        <li
          v-for="(text, i) in profile.howIWork"
          :key="text"
        >
          <span
            class="services__step-n"
            aria-hidden="true"
          >{{ step(i) }}</span>
          <span>{{ text }}</span>
        </li>
      </ol>
    </section>

    <div class="services__pair">
      <section
        class="services__card services__card--ai"
        aria-labelledby="services-ai"
        data-section="ai"
      >
        <p class="label services__accent">
          My AI rules
        </p>
        <h2 id="services-ai">
          AI speeds me up. It never ships alone.
        </h2>
        <ul class="services__rules">
          <li
            v-for="rule in profile.aiRules"
            :key="rule"
          >
            {{ rule }}
          </li>
        </ul>
      </section>

      <section
        class="services__card"
        aria-labelledby="services-roles"
        data-section="roles"
      >
        <p class="label">
          Hiring full-time?
        </p>
        <h2 id="services-roles">
          I am open to remote roles too
        </h2>
        <p class="services__muted">
          {{ roles }}
        </p>
        <div>
          <AppButton
            to="/cv"
            variant="ghost"
          >
            See my CV
          </AppButton>
        </div>
      </section>
    </div>

    <section
      class="services__section services__contact"
      aria-labelledby="services-contact"
      data-section="contact"
    >
      <h2 id="services-contact">
        Get a fixed price
      </h2>
      <ContactBlock
        :upwork="site.links.upwork"
        :hours="site.hours"
        :reply-promise="site.replyPromise"
      />
    </section>
  </div>
</template>

<style scoped>
.services {
  display: flex;
  flex-direction: column;
  gap: 48px;
  padding-bottom: 64px;
}

.services__head {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 700px;
}

.services__muted {
  color: var(--muted);
}

.services__accent,
.services__group-name {
  color: var(--jade);
}

/* The groups: the name and note beside the services from 760 px up, one
   column on phones. */
.services__group {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 16px;
  padding: 28px 0;
  border-top: 1px solid var(--line);
}

.services__group-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.services__group-name {
  font-size: 0.72rem;
  line-height: 1.3;
}

.services__items {
  display: flex;
  flex-direction: column;
  gap: 24px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.services__item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.services__title {
  font-size: 1.375rem;
}

.services__summary {
  max-width: 62ch;
}

/* Case study titles can hold commas, so each proof link is its own line. */
.services__proof {
  display: flex;
  flex-wrap: wrap;
  gap: 2px 8px;
}

.services__proof-label {
  color: var(--muted);
  font-family: var(--font-mono);
}

.services__proof-links {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.services__section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.services__section-head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.services__steps {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.services__steps > li {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
  font-size: 0.9375rem;
}

.services__step-n {
  color: var(--jade);
  font-family: var(--font-mono);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.services__pair {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
}

.services__card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.services__card h2 {
  font-size: 1.5rem;
}

.services__card--ai {
  border-color: transparent;
  background: var(--jade-soft);
}

.services__rules {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding-left: 20px;
}

/* ContactBlock draws its own box, so this section has no card around it. */
.services__contact h2 {
  font-size: 1.75rem;
}

@media (min-width: 760px) {
  .services {
    gap: 64px;
    padding-bottom: 96px;
  }

  .services__group {
    grid-template-columns: minmax(0, 220px) minmax(0, 1fr);
    gap: 24px;
  }

  .services__title {
    font-size: 1.5rem;
  }

  .services__pair {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .services__card {
    padding: 28px;
  }
}

/* The steps sit in one row only where each card has room for its sentence. */
@media (min-width: 960px) {
  .services__steps {
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }
}
</style>
