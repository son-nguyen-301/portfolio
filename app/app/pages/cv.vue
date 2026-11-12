<script setup lang="ts">
// The CV page (PF-018, docs/design/CV.dc.html): name, title and place, the
// links, the roles Son wants, a summary, the jobs, skills, education and
// languages, with a print stylesheet. `pnpm cv:pdf` prints this page to the
// PDF (scripts/cv-pdf.ts).
//
// Every fact comes from app/content: profile.yml, timeline.yml and
// skills.yml. The summary is the hero's subline. The labels written here hold
// no fact (D-024).
//
// The email and the PDF link are in no built file of this page (D-021,
// D-033). After mount, and only when the visit is not in Upwork mode, the
// page downloads the email from /contact-details.json and shows it with the
// "Download PDF" link. With JavaScript off, or in Upwork mode, neither shows.
import { onMounted, ref } from 'vue'
import { loadContactDetails } from '../utils/contact'
import { cvPdfPath, educationLine, joinItems, siteHost } from '../utils/cv'
import { offsetText } from '../utils/overlap'

const { data: profile } = await useProfile('name', 'title', 'location', 'utcOffset', 'languages', 'openTo', 'roles', 'links', 'hero')
const { data: timeline } = await useTimeline()
const { data: skills } = await useSkills()

const site = useSiteConfig()
const upworkMode = useUpworkMode()

// Set after mount: the buttons need JavaScript, and the email and the PDF
// link need a visit that is not in Upwork mode.
const ready = ref(false)
const email = ref<string>()

// Runs after useUpworkMode() has read the mode, which registered its own
// onMounted first.
onMounted(async () => {
  ready.value = true
  if (upworkMode.value) return
  const details = await loadContactDetails()
  // Check again, so the email never shows next to Upwork mode.
  if (details && !upworkMode.value) email.value = details.email
})

function print() {
  window.print()
}

useSeoMeta({
  title: 'CV',
  description: () => profile.value?.hero.subline,
})
</script>

<template>
  <article
    v-if="profile && timeline && skills"
    class="cv"
    aria-labelledby="cv-name"
  >
    <div class="cv__toolbar">
      <p class="label">
        CV
      </p>
      <div class="cv__actions">
        <AppButton
          v-if="ready && !upworkMode"
          :to="cvPdfPath"
          variant="primary"
          external
          download
        >
          Download PDF
        </AppButton>
        <AppButton
          v-if="ready"
          variant="ghost"
          @click="print"
        >
          Print
        </AppButton>
      </div>
    </div>

    <header class="cv__head">
      <h1 id="cv-name">
        {{ profile.name }}
      </h1>
      <p class="cv__title">
        {{ profile.title }} · {{ profile.location }} ({{ offsetText(profile.utcOffset) }})
      </p>
      <!-- An empty line until the email loads, so nothing below it moves.
           The line holds nothing in the built page (D-033). -->
      <p class="cv__email not-upwork">
        <span v-if="email">{{ email }}</span>
      </p>
      <ul
        class="cv__links"
        aria-label="Links"
      >
        <li class="not-upwork">
          <a :href="profile.links.linkedin">LinkedIn</a>
        </li>
        <li>
          <a :href="profile.links.github">GitHub</a>
        </li>
        <li class="upwork-only">
          <a :href="profile.links.upwork">Upwork</a>
        </li>
        <li>
          <a :href="site.url">{{ siteHost(site.url) }}</a>
        </li>
      </ul>
    </header>

    <section
      class="cv__sec"
      aria-labelledby="cv-looking"
    >
      <h2
        id="cv-looking"
        class="label"
      >
        Looking for
      </h2>
      <div class="cv__body">
        <p>{{ joinItems(profile.roles) }}</p>
        <p class="cv__muted">
          {{ joinItems(profile.openTo) }}
        </p>
      </div>
    </section>

    <section
      class="cv__sec"
      aria-labelledby="cv-summary"
    >
      <h2
        id="cv-summary"
        class="label"
      >
        Summary
      </h2>
      <p class="cv__body">
        {{ profile.hero.subline }}
      </p>
    </section>

    <section
      class="cv__sec"
      aria-labelledby="cv-experience"
    >
      <h2
        id="cv-experience"
        class="label"
      >
        Experience
      </h2>
      <div class="cv__body">
        <Timeline
          :jobs="timeline.jobs"
          layout="compact"
        />
      </div>
    </section>

    <section
      class="cv__sec"
      aria-labelledby="cv-skills"
    >
      <h2
        id="cv-skills"
        class="label"
      >
        Skills
      </h2>
      <dl class="cv__body cv__skills">
        <div
          v-for="group in skills.groups"
          :key="group.name"
        >
          <dt>{{ group.name }}</dt>
          <dd>{{ joinItems(group.items) }}</dd>
        </div>
      </dl>
    </section>

    <section
      class="cv__sec"
      aria-labelledby="cv-education"
    >
      <h2
        id="cv-education"
        class="label"
      >
        Education
      </h2>
      <div class="cv__body">
        <p
          v-for="school in timeline.education"
          :key="`${school.school}-${school.start}`"
        >
          {{ educationLine(school) }}
        </p>
      </div>
    </section>

    <section
      class="cv__sec"
      aria-labelledby="cv-languages"
    >
      <h2
        id="cv-languages"
        class="label"
      >
        Languages
      </h2>
      <p class="cv__body">
        {{ joinItems(profile.languages) }}
      </p>
    </section>
  </article>
</template>

<style scoped>
.cv {
  display: flex;
  flex-direction: column;
  max-width: 880px;
  padding-bottom: 64px;
}

.cv__muted {
  color: var(--muted);
}

.cv__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 16px;
  min-height: 44px;
  margin-bottom: 32px;
}

.cv__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.cv__head {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-bottom: 24px;
}

.cv__title {
  color: var(--muted);
  font-size: var(--text-lead);
}

.cv__email {
  min-height: calc(1em * var(--leading-body));
  margin-top: 8px;
  overflow-wrap: anywhere;
}

.cv__links {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

/* A label column and the text beside it, one column on phones. */
.cv__sec {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 8px 24px;
  padding: 22px 0;
  border-top: 1px solid var(--line);
}

.cv__sec h2 {
  font-size: var(--text-label);
}

.cv__body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  margin: 0;
}

.cv__skills dt {
  font-weight: 600;
}

.cv__skills dd {
  margin: 0;
  color: var(--muted);
}

.cv__skills > div + div {
  margin-top: 6px;
}

@media (min-width: 760px) {
  .cv__sec {
    grid-template-columns: minmax(0, 170px) minmax(0, 1fr);
  }

  .cv__sec h2 {
    padding-top: 4px;
  }
}

/* Print and the PDF: no buttons, the label column on an A4 page, smaller type. */
@media print {
  .cv {
    max-width: none;
    padding-bottom: 0;
    font-size: 10pt;
  }

  .cv__toolbar {
    display: none;
  }

  .cv__head {
    padding-bottom: 12px;
  }

  .cv__head h1 {
    font-size: 22pt;
  }

  .cv__title {
    font-size: 11pt;
  }

  .cv__sec {
    grid-template-columns: 30mm minmax(0, 1fr);
    padding: 10px 0;
    break-inside: avoid;
  }

  /* Experience runs over the page break; each job stays whole. */
  .cv__sec:has(.timeline) {
    break-inside: auto;
  }

  .cv__links a {
    color: var(--ink);
  }
}
</style>
