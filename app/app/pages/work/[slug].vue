<script setup lang="ts">
// A case study page (PF-013, docs/design/CaseStudy.dc.html and
// CaseStudyPhone.dc.html). Desktop: a side panel with the facts and the
// action button beside the story. Phones: one column, the title first, then
// the facts, then the story.
//
// The story is the Markdown body, split at its `##` headings
// (app/utils/case-study.ts): The problem, What I did (numbered steps and the
// Hard choice callout), The result. The result tiles sit under the title, as
// in the design screen. Then the screens or diagrams, the quote (none until a
// written one exists), "Need something like this?" and the previous and next
// links. Every fact comes from app/content; the labels, headings and link
// labels written here hold none (D-024).
//
// In Upwork mode the action buttons say "Message me on Upwork" instead of
// "Book a 30-minute call", which goes to /contact. Neither is a contact
// detail, so the classes `not-upwork` and `upwork-only` switch them (D-020).
import type { MinimarkNode } from '~/utils/case-study'

const route = useRoute()
const path = `/work/${route.params.slug}`
const { data: study } = await useCaseStudy(path)

if (!study.value) {
  throw createError({ statusCode: 404, statusMessage: 'Page not found', fatal: true })
}

const { data: nav } = await useWorkNav()
const { data: profile } = await useProfile('pricing')
const site = useSiteProfile()

const sections = computed(() => storySections((study.value?.body?.value ?? []) as MinimarkNode[]).map(section => ({
  ...section,
  body: { body: { type: 'minimark', value: section.nodes } },
})))
const media = computed(() => study.value?.media ?? [])
const metrics = computed(() => study.value?.metrics ?? [])
const studies = computed(() => nav.value ?? [])
const place = computed(() => neighbours(studies.value, path))

// The title and the client word by word, so they never break after a hyphen
// ("Multi-" / "currency", "e-" / "commerce"), as on the home page (D-024).
const title = computed(() => words(study.value?.title ?? ''))
const client = computed(() => words(study.value?.client ?? ''))

useSeoMeta({
  title: study.value.title,
  description: metaDescription(study.value.summary),
})

// The case study as a schema.org CreativeWork, by Son: its author is the
// Person node that app.vue adds as the site's identity (D-036). A custom node
// gets no URL resolving, so its ids are full URLs, as the module writes them.
const siteUrl = useSiteConfig().url
const pageUrl = `${siteUrl}${path}`
useSchemaOrg([{
  '@type': 'CreativeWork',
  '@id': `${pageUrl}#creativework`,
  'name': study.value.title,
  'description': study.value.summary,
  'url': pageUrl,
  'keywords': study.value.stack,
  'author': { '@id': `${siteUrl}/#identity` },
  'mainEntityOfPage': { '@id': `${pageUrl}#webpage` },
}])
</script>

<template>
  <div
    v-if="study"
    class="case-study"
  >
    <nav
      aria-label="Breadcrumb"
      class="case-study__crumbs"
    >
      <NuxtLink to="/work">
        Work
      </NuxtLink>
      <span
        v-if="place.index >= 0"
        class="case-study__muted"
      > / Case study {{ place.index + 1 }} of {{ studies.length }}</span>
    </nav>

    <div class="case-study__grid">
      <header class="case-study__head">
        <h1>
          <template
            v-for="(word, i) in title"
            :key="i"
          >
            <span class="keep-word">{{ word }}</span>{{ i < title.length - 1 ? ' ' : '' }}
          </template>
        </h1>
        <p class="lead">
          {{ study.summary }}
        </p>
      </header>

      <aside
        class="case-study__facts"
        aria-label="Project facts"
      >
        <p class="label">
          Case study
        </p>
        <dl class="case-study__list">
          <dt>Client</dt>
          <dd>
            <template
              v-for="(word, i) in client"
              :key="i"
            >
              <span class="keep-word">{{ word }}</span>{{ i < client.length - 1 ? ' ' : '' }}
            </template>
          </dd>
          <dt>Role</dt>
          <dd>{{ study.role }}</dd>
          <template v-if="study.team">
            <dt>Team</dt>
            <dd>{{ study.team }}</dd>
          </template>
          <dt>When</dt>
          <dd>{{ study.period }}</dd>
          <dt>Stack</dt>
          <dd>
            <TagList
              :tags="study.stack"
              label="Stack"
            />
          </dd>
        </dl>
        <div class="case-study__action">
          <AppButton
            to="/contact"
            variant="action"
            class="not-upwork"
          >
            Book a 30-minute call
          </AppButton>
          <AppButton
            :to="site.links.upwork"
            variant="action"
            class="upwork-only"
            data-track="message-upwork"
          >
            Message me on Upwork
          </AppButton>
          <p class="case-study__muted small">
            {{ site.replyPromise }}
          </p>
        </div>
      </aside>

      <article class="case-study__story">
        <ul
          v-if="metrics.length"
          class="case-study__tiles"
          aria-label="Results"
        >
          <li
            v-for="metric in metrics"
            :key="metric.label"
          >
            <MetricTile
              :value="metric.value"
              :label="metric.label"
            />
          </li>
        </ul>

        <section
          v-for="(section, i) in sections"
          :key="section.id || i"
          class="case-study__section"
          :aria-labelledby="section.id || undefined"
          :data-section="section.id || undefined"
        >
          <h2
            v-if="section.heading"
            :id="section.id || undefined"
          >
            {{ section.heading }}
          </h2>
          <ContentRenderer
            :value="section.body"
            :prose="false"
            class="case-study__prose"
          />
        </section>

        <section
          v-if="media.length"
          class="case-study__section"
          aria-labelledby="case-media"
          data-section="media"
        >
          <h2 id="case-media">
            {{ mediaHeading(media) }}
          </h2>
          <CaseStudyMedia :items="media" />
        </section>

        <QuoteBlock
          :quote="study.quote"
          data-section="quote"
        />

        <section
          class="case-study__cta"
          aria-labelledby="case-cta"
          data-section="contact"
        >
          <div class="case-study__cta-text">
            <h2 id="case-cta">
              Need something like this?
            </h2>
            <p
              v-if="profile"
              class="case-study__muted"
            >
              {{ profile.pricing }}
            </p>
            <p class="case-study__muted small">
              {{ site.replyPromise }}
            </p>
          </div>
          <div>
            <AppButton
              to="/contact"
              variant="action"
              class="not-upwork"
            >
              Book a 30-minute call
            </AppButton>
            <AppButton
              :to="site.links.upwork"
              variant="action"
              class="upwork-only"
              data-track="message-upwork"
            >
              Message me on Upwork
            </AppButton>
          </div>
        </section>

        <nav
          aria-label="More case studies"
          class="case-study__more"
        >
          <NuxtLink
            :to="place.previous?.path ?? '/work'"
            class="case-study__more-link"
            :rel="place.previous ? 'prev' : undefined"
          >
            <span class="label">{{ place.previous ? '← Previous' : '← All work' }}</span>
            <span class="case-study__more-title">{{ place.previous?.title ?? `Back to the ${studies.length} case studies` }}</span>
          </NuxtLink>
          <NuxtLink
            :to="place.next?.path ?? '/work'"
            class="case-study__more-link case-study__more-link--next"
            :rel="place.next ? 'next' : undefined"
          >
            <span class="label">{{ place.next ? 'Next →' : 'All work →' }}</span>
            <span class="case-study__more-title">{{ place.next?.title ?? `Back to the ${studies.length} case studies` }}</span>
          </NuxtLink>
        </nav>
      </article>
    </div>
  </div>
</template>

<style scoped>
.case-study {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding-bottom: 64px;
}

.case-study__crumbs {
  font-size: var(--text-small);
}

.case-study__muted {
  color: var(--muted);
}

/* Phones: the title, the facts, then the story. */
.case-study__grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: "head" "facts" "story";
  gap: 32px;
}

.case-study__head {
  grid-area: head;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.case-study__facts {
  grid-area: facts;
  display: flex;
  flex-direction: column;
  gap: 18px;
  min-width: 0;
  padding: 20px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.case-study__list {
  display: grid;
  grid-template-columns: 64px minmax(0, 1fr);
  gap: 10px 12px;
  margin: 0;
  font-size: var(--text-small);
}

.case-study__list dt {
  padding-top: 2px;
  color: var(--muted);
  font-family: var(--font-mono);
  font-size: var(--text-label);
}

.case-study__list dd {
  min-width: 0;
  margin: 0;
}

.case-study__action {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.case-study__story {
  grid-area: story;
  display: flex;
  flex-direction: column;
  gap: 40px;
  min-width: 0;
}

.case-study__tiles {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.case-study__tiles > li {
  display: flex;
  padding: 16px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.case-study__tiles :deep(.metric-tile__value) {
  font-size: 1.375rem;
}

.case-study__section {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.case-study__section h2,
.case-study__cta h2 {
  font-size: 1.4375rem;
}

/* The Markdown body of one section. */
.case-study__prose {
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 1.0625rem;
}

.case-study__prose :deep(ul) {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-left: 20px;
}

/* "What I did": numbered steps, 01, 02, ... */
.case-study__prose :deep(ol) {
  display: flex;
  flex-direction: column;
  padding: 0;
  list-style: none;
  counter-reset: step;
}

.case-study__prose :deep(ol > li) {
  position: relative;
  padding: 14px 0 14px 40px;
  border-bottom: 1px solid var(--line);
  counter-increment: step;
}

.case-study__prose :deep(ol > li)::before {
  content: counter(step, decimal-leading-zero);
  position: absolute;
  top: 14px;
  left: 0;
  color: var(--muted);
  font-family: var(--font-mono);
  font-weight: 600;
}

.case-study__prose :deep(ol > li > ul) {
  margin-top: 10px;
}

.case-study__prose :deep(blockquote) {
  padding-left: 18px;
  border-left: 3px solid var(--line);
}

.case-study__prose :deep(.hard-choice) {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 16px 20px;
  border-left: 3px solid var(--jade);
  border-radius: 0 var(--radius) var(--radius) 0;
  background: var(--jade-soft);
}

.case-study__prose :deep(.hard-choice__label) {
  color: var(--jade);
}

.case-study__cta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 24px;
  border: 1px solid var(--line);
  border-radius: var(--radius-card);
  background: var(--surface);
}

.case-study__cta-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.case-study__more {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.case-study__more-link {
  display: flex;
  flex-direction: column;
  gap: 4px;
  text-decoration: none;
}

.case-study__more-link--next {
  text-align: right;
}

.case-study__more-title {
  color: var(--ink);
  font-size: var(--text-small);
  font-weight: 600;
}

.case-study__more-link:hover .case-study__more-title {
  text-decoration: underline;
}

/* Desktop: the side panel on the left, beside the title and the story. */
@media (min-width: 760px) {
  .case-study {
    gap: 32px;
    padding-bottom: 96px;
  }

  .case-study__grid {
    grid-template-columns: minmax(0, 300px) minmax(0, 1fr);
    grid-template-rows: auto 1fr;
    grid-template-areas: "facts head" "facts story";
    column-gap: 56px;
    row-gap: 40px;
    align-items: start;
  }

  .case-study__facts {
    padding: 24px;
  }

  .case-study__list {
    grid-template-columns: 72px minmax(0, 1fr);
  }

  .case-study__head h1 {
    font-size: 2.75rem;
    letter-spacing: -0.02em;
  }

  .case-study__section h2 {
    font-size: 1.75rem;
  }

  .case-study__more-title {
    font-size: var(--text-body);
  }
}
</style>
