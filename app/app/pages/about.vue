<script setup lang="ts">
// The about page (PF-016, docs/design/About.dc.html): the about text with its
// first sentence as the headline, a facts box (place, hours, languages, what
// Son is open to, roles), the career list with education, more work at Aspire,
// the skill groups and the earlier projects at XTEL (`#earlier`, linked from
// /work).
//
// Every fact comes from app/content: profile.yml, timeline.yml, skills.yml and
// earlier.yml. The labels, headings and link labels written here hold no fact
// (D-024). The two company names in headings are checked against
// timeline.yml by companyJob(), so the build fails if one is gone (D-032).
//
// The profile fields are named one by one, never `email` or `booking`
// (D-021), so the page holds no contact details in any mode.
const { data: profile } = await useProfile('about', 'location', 'utcOffset', 'hours', 'languages', 'openTo', 'roles')
const { data: timeline } = await useTimeline()
const { data: skills } = await useSkills()
const { data: earlier } = await useEarlier()

const about = computed(() => (profile.value ? aboutText(profile.value.about) : undefined))

// "Also at Aspire", and "XTEL, 2019 to 2021" under Earlier projects.
const aspire = computed(() => (timeline.value ? companyJob(timeline.value.jobs, 'Aspire') : undefined))
const xtel = computed(() => (timeline.value ? companyJob(timeline.value.jobs, 'XTEL') : undefined))

useSeoMeta({
  title: 'About',
  description: () => (profile.value ? metaDescription(aboutParagraphs(profile.value.about)[0]) : undefined),
})

// The link preview image (D-037): the page label and heading.
defineOgImage('Page', { label: 'About', title: about.value?.headline })
</script>

<template>
  <div
    v-if="profile && about && timeline && skills && earlier"
    class="about"
  >
    <section
      class="about__intro"
      aria-labelledby="about-title"
    >
      <div class="about__text">
        <p class="label">
          About
        </p>
        <h1 id="about-title">
          {{ about.headline }}
        </h1>
        <div class="about__paragraphs">
          <p
            v-for="text in about.paragraphs"
            :key="text"
          >
            {{ text }}
          </p>
        </div>
      </div>
      <dl
        class="about__facts"
        aria-label="Quick facts"
      >
        <div>
          <dt class="label">
            Based in
          </dt>
          <dd>{{ profile.location }} ({{ offsetText(profile.utcOffset) }})</dd>
        </div>
        <div>
          <dt class="label">
            Working hours
          </dt>
          <dd>{{ profile.hours.label }}</dd>
        </div>
        <div>
          <dt class="label">
            Languages
          </dt>
          <dd
            v-for="item in profile.languages"
            :key="item"
          >
            {{ item }}
          </dd>
        </div>
        <div>
          <dt class="label">
            Open to
          </dt>
          <dd
            v-for="item in profile.openTo"
            :key="item"
          >
            {{ item }}
          </dd>
        </div>
        <div>
          <dt class="label">
            Roles
          </dt>
          <dd
            v-for="item in profile.roles"
            :key="item"
          >
            {{ item }}
          </dd>
        </div>
      </dl>
    </section>

    <section
      class="about__section"
      aria-labelledby="career"
    >
      <div class="about__section-head about__section-head--row">
        <h2 id="career">
          Career
        </h2>
        <NuxtLink
          to="/cv"
          class="about__cv"
        >
          See it as a CV →
        </NuxtLink>
      </div>
      <Timeline
        :jobs="timeline.jobs"
        :education="timeline.education"
        layout="rows"
      />
      <div
        v-if="aspire && earlier.aspire.length"
        class="about__more"
        data-section="aspire"
      >
        <h3 id="about-aspire">
          Also at {{ aspire.company }}
        </h3>
        <ul
          class="about__more-list"
          aria-labelledby="about-aspire"
        >
          <li
            v-for="item in earlier.aspire"
            :key="item"
          >
            {{ item }}
          </li>
        </ul>
      </div>
    </section>

    <section
      class="about__section"
      aria-labelledby="skills"
    >
      <h2 id="skills">
        Skills
      </h2>
      <div class="about__skills">
        <div
          v-for="group in skills.groups"
          :key="group.name"
          class="about__skill-group"
          :data-group="group.name"
        >
          <h3 class="label about__skill-name">
            {{ group.name }}
          </h3>
          <TagList
            :tags="group.items"
            :label="group.name"
          />
        </div>
      </div>
    </section>

    <section
      id="earlier"
      class="about__section"
      aria-labelledby="earlier-title"
    >
      <div class="about__section-head">
        <h2 id="earlier-title">
          Earlier projects
        </h2>
        <p
          v-if="xtel"
          class="about__muted"
        >
          {{ xtel.company }}, {{ yearSpan(xtel) }}
        </p>
      </div>
      <ul class="about__projects">
        <li
          v-for="project in earlier.xtel"
          :key="project.name"
          class="about__project"
        >
          <h3>{{ project.name }}</h3>
          <p class="about__muted small">
            {{ project.summary }}
          </p>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.about {
  display: flex;
  flex-direction: column;
  gap: 56px;
  padding-bottom: 64px;
}

.about__muted {
  color: var(--muted);
}

/* The text and the facts box: side by side from 760 px up. */
.about__intro {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 32px;
}

.about__text {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.about__paragraphs {
  display: flex;
  flex-direction: column;
  gap: 14px;
  max-width: 64ch;
  font-size: var(--text-lead);
}

.about__facts {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin: 0;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.about__facts dd {
  margin: 0;
}

.about__section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Scroll to #earlier below the sticky header. */
#earlier {
  scroll-margin-top: 96px;
}

.about__section-head {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.about__section-head--row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 8px 16px;
}

.about__cv {
  font-weight: 600;
}

.about__more {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.about__more h3 {
  font-size: 1.25rem;
}

.about__more-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-width: var(--measure);
  margin: 0;
  padding-left: 1.1em;
  color: var(--muted);
}

.about__skills {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 24px;
}

.about__skill-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.about__skill-name {
  font-size: 0.72rem;
  line-height: 1.3;
}

.about__projects {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.about__project {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.about__project h3 {
  font-size: 1.125rem;
}

@media (min-width: 760px) {
  .about {
    gap: 72px;
    padding-bottom: 96px;
  }

  .about__intro {
    grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr);
    gap: 56px;
  }

  .about__skills,
  .about__projects {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
