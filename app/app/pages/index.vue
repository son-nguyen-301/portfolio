<script setup lang="ts">
// The home page, in the section order of docs/design.md (Home page): hero with
// the clock, proof strip, selected work, services, how I work, quotes (only
// once a case study has one) and contact. Every fact and most words come from
// app/content. Section labels, headings, link labels and aria-labels are
// written here, from the design screens, and hold no fact (D-024).
//
// The profile fields are named one by one, and never `email` or `booking`:
// ContactBlock gets those after mount, outside Upwork mode (D-021).
const { data: profile } = await useProfile('title', 'location', 'utcOffset', 'hours', 'replyPromise', 'links', 'hero', 'proofStrip', 'howIWork', 'aiRules', 'pricing')
const { data: services } = await useServices()
const { data: work } = await useWorkCards()

// The headline word by word, so it never breaks after the hyphen in
// "e-commerce" (app/utils/words.ts).
const headline = computed(() => words(profile.value?.hero.headline ?? ''))

const city = computed(() => locationCity(profile.value?.location ?? ''))
const featured = computed(() => (work.value ?? []).filter(study => study.featured))
const quotes = computed(() => (work.value ?? []).flatMap(study => (study.quote ? [study.quote] : [])))

// "01", "02", ...
const step = (i: number) => String(i + 1).padStart(2, '0')

useSeoMeta({
  title: () => profile.value?.title,
  // The headline and as much of the subline as fits (app/utils/seo.ts).
  description: () => (profile.value ? metaDescription(profile.value.hero.headline, profile.value.hero.subline) : undefined),
})

// The link preview image (D-037): the hero label and headline.
usePageOgImage({ label: profile.value?.hero.label, title: profile.value?.hero.headline })
</script>

<template>
  <div
    v-if="profile"
    class="home"
  >
    <section
      class="home-hero"
      data-section="hero"
      aria-labelledby="home-title"
    >
      <div class="home-hero__text">
        <p class="label">
          {{ profile.hero.label }}
        </p>
        <h1 id="home-title">
          <template
            v-for="(word, i) in headline"
            :key="i"
          >
            <span class="keep-word">{{ word }}</span>{{ i < headline.length - 1 ? ' ' : '' }}
          </template>
        </h1>
        <p class="lead home-hero__subline">
          {{ profile.hero.subline }}
        </p>
        <div class="home-hero__actions">
          <AppButton
            v-for="path in profile.hero.paths"
            :key="path.to"
            :to="path.to"
            variant="primary"
          >
            {{ path.label }}
          </AppButton>
          <AppButton
            to="/work"
            variant="ghost"
          >
            See my work
          </AppButton>
        </div>
        <p class="home-hero__reply">
          {{ profile.replyPromise }}
        </p>
      </div>
      <TimeOverlap
        :city="city"
        :utc-offset="profile.utcOffset"
        :start="profile.hours.start"
        :end="profile.hours.end"
      />
    </section>

    <section
      data-section="proof"
      aria-label="Proof in numbers"
    >
      <ProofStrip :items="profile.proofStrip" />
    </section>

    <section
      v-if="featured.length"
      class="home-section"
      data-section="work"
      aria-labelledby="home-work"
    >
      <div class="home-section__head home-section__head--row">
        <div class="home-section__titles">
          <p class="label">
            Selected work
          </p>
          <h2 id="home-work">
            Proof that matches your job
          </h2>
        </div>
        <NuxtLink
          to="/work"
          class="home-more"
        >
          All {{ work?.length }} case studies →
        </NuxtLink>
      </div>
      <ul class="home-work">
        <li
          v-for="study in featured"
          :key="study.path"
        >
          <WorkCard
            :to="study.path"
            :title="study.title"
            :summary="study.summary"
            :stack="study.stack"
            :metric="study.cardMetric"
          />
        </li>
      </ul>
    </section>

    <section
      v-if="services"
      class="home-section"
      data-section="services"
      aria-labelledby="home-services"
    >
      <div class="home-section__head">
        <p class="label">
          Services
        </p>
        <h2 id="home-services">
          What I can do for you
        </h2>
        <p class="home-section__intro">
          {{ profile.pricing }}
        </p>
      </div>
      <ul class="home-services">
        <li
          v-for="item in services.items"
          :key="item.id"
          class="home-services__item"
        >
          <p class="label home-services__group">
            {{ item.group }}
          </p>
          <h3 class="home-services__title">
            {{ item.title }}
          </h3>
          <p class="home-services__summary">
            {{ item.summary }}
          </p>
        </li>
      </ul>
      <NuxtLink
        to="/services"
        class="home-more"
      >
        See every service and how a project starts →
      </NuxtLink>
    </section>

    <section
      class="home-section home-how"
      data-section="how"
      aria-labelledby="home-how"
    >
      <div class="home-how__steps">
        <div class="home-section__head">
          <p class="label">
            How I work
          </p>
          <h2 id="home-how">
            Clear steps, written updates
          </h2>
        </div>
        <ol class="home-steps">
          <li
            v-for="(text, i) in profile.howIWork"
            :key="text"
          >
            <span
              class="home-steps__n"
              aria-hidden="true"
            >{{ step(i) }}</span>
            <span>{{ text }}</span>
          </li>
        </ol>
      </div>
      <div class="home-ai">
        <p class="label home-ai__label">
          How I use AI
        </p>
        <h3 class="home-ai__title">
          AI speeds me up. It never ships alone.
        </h3>
        <ul class="home-ai__rules">
          <li
            v-for="rule in profile.aiRules"
            :key="rule"
          >
            {{ rule }}
          </li>
        </ul>
      </div>
    </section>

    <section
      v-if="quotes.length"
      class="home-section"
      data-section="quotes"
      aria-labelledby="home-quotes"
    >
      <h2 id="home-quotes">
        What people say
      </h2>
      <div class="home-quotes">
        <QuoteBlock
          v-for="quote in quotes"
          :key="quote.text"
          :quote="quote"
        />
      </div>
    </section>

    <section
      class="home-section"
      data-section="contact"
      aria-labelledby="home-contact"
    >
      <div class="home-section__head">
        <p class="label">
          Contact
        </p>
        <h2 id="home-contact">
          Tell me what you are building
        </h2>
      </div>
      <ContactBlock
        :upwork="profile.links.upwork"
        :hours="profile.hours.label"
        :reply-promise="profile.replyPromise"
      />
    </section>
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: 48px;
  padding-bottom: 64px;
}

/* Hero: text and clock side by side on wide screens, the clock below the
   text on narrow ones. The two columns start at 960 px, so the clock is
   never squeezed. */
.home-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 32px;
  align-items: start;
}

.home-hero__text {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home-hero__subline {
  color: var(--muted);
}

.home-hero__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.home-hero__reply {
  color: var(--muted);
  font-size: var(--text-small);
}

/* One short fade-up on first load, for the hero text only. Without the
   animation the text is simply there. */
@media (prefers-reduced-motion: no-preference) {
  .home-hero__text {
    animation: home-fade-up 0.45s ease-out both;
  }
}

@keyframes home-fade-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
}

.home-section {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.home-section__head {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-section__head--row {
  flex-direction: row;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
}

.home-section__titles {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-section__intro {
  color: var(--muted);
}

.home-more {
  align-self: flex-start;
  font-weight: 600;
}

.home-work {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 20px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-work > li {
  display: flex;
}

.home-work > li > * {
  flex: 1;
}

.home-services {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--line);
  list-style: none;
}

.home-services__item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 20px 0;
  border-bottom: 1px solid var(--line);
}

.home-services__group,
.home-ai__label {
  color: var(--jade);
}

.home-services__title {
  font-size: 1.2rem;
  font-weight: 700;
}

.home-services__summary {
  color: var(--muted);
  font-size: 0.9375rem;
}

.home-how {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 32px;
  align-items: start;
}

.home-how__steps {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.home-steps {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}

.home-steps > li {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid var(--line);
}

.home-steps__n {
  color: var(--muted);
  font-family: var(--font-mono);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
}

.home-ai {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 24px;
  border-radius: var(--radius-card);
  background: var(--jade-soft);
}

.home-ai__title {
  font-size: 1.375rem;
  font-weight: 700;
}

.home-ai__rules {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
}

.home-quotes {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

@media (min-width: 720px) {
  .home {
    gap: 88px;
    padding-bottom: 96px;
  }

  .home-hero {
    padding-top: 24px;
  }

  .home-work {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .home-services {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    column-gap: 24px;
  }

  .home-how {
    grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr);
    gap: 48px;
  }
}

@media (min-width: 960px) {
  /* The clock column is at least 440 px, so a long city such as
     "Los Angeles" fits in the "Your time" label. */
  .home-hero {
    grid-template-columns: minmax(0, 1.3fr) minmax(440px, 1fr);
    gap: 48px;
  }
}
</style>
