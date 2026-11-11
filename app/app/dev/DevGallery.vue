<script setup lang="ts">
// Dev-only gallery of tokens, type, base styles and base components
// (modules/dev-gallery.ts). Never built: `nuxt generate` has no /_gallery route.
// Use the theme switch at the top to see every part in light and dark.
// Facts come from app/content through the composables, as on real pages.
useSeoMeta({ title: 'Gallery', robots: 'noindex, nofollow' })

const { data: profile } = await useProfile('proofStrip', 'location', 'utcOffset', 'hours')
const { data: caseStudies } = await useCaseStudies()
const { data: timeline } = await useTimeline()
const siteProfile = useSiteProfile()
const cards = computed(() => (caseStudies.value ?? []).slice(0, 2))

// No case study has a quote yet, so this one is only to show the look.
const sampleQuote = { text: 'Sample quote. Real quotes come from app/content/work when Son has them.', role: 'Sample role' }

const colors = ['paper', 'surface', 'ink', 'muted', 'line', 'jade', 'jade-soft', 'amber', 'amber-soft', 'on-jade']
const scale = [
  { name: 'h1', size: 'var(--text-h1)', font: 'var(--font-display)' },
  { name: 'h2', size: 'var(--text-h2)', font: 'var(--font-display)' },
  { name: 'h3', size: 'var(--text-h3)', font: 'var(--font-display)' },
  { name: 'lead', size: 'var(--text-lead)', font: 'var(--font-body)' },
  { name: 'body', size: 'var(--text-body)', font: 'var(--font-body)' },
  { name: 'small', size: 'var(--text-small)', font: 'var(--font-body)' },
  { name: 'label', size: 'var(--text-label)', font: 'var(--font-mono)' },
]
</script>

<template>
  <div class="gallery">
    <h1>Gallery</h1>
    <p class="lead">
      Tokens, type and base styles in the current theme. Dev only.
    </p>

    <section>
      <h2 class="label">
        Theme
      </h2>
      <ThemeSwitch />
    </section>

    <section>
      <h2 class="label">
        Color tokens
      </h2>
      <ul class="swatches">
        <li
          v-for="color in colors"
          :key="color"
        >
          <span
            class="chip"
            :style="{ background: `var(--${color})` }"
          />
          <code>--{{ color }}</code>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="label">
        Type scale
      </h2>
      <p
        v-for="step in scale"
        :key="step.name"
        :style="{ fontSize: step.size, fontFamily: step.font }"
      >
        {{ step.name }}: The quick brown fox jumps over the lazy dog
      </p>
    </section>

    <section>
      <h2 class="label">
        Text helpers
      </h2>
      <p class="label">
        Uppercase label
      </p>
      <p class="num">
        0123456789
      </p>
      <p>
        Body text with <a href="#gallery">a link</a> and <code>inline code</code>.
        Running text stops at about 68 characters, so long lines stay easy to read on a wide screen.
      </p>
    </section>

    <section>
      <h2 class="label">
        Focus ring
      </h2>
      <p class="small">
        Press Tab: every link and button shows a 2px jade outline.
      </p>
      <p>
        <a
          id="gallery"
          href="#gallery"
        >Focusable link</a>
      </p>
    </section>

    <section>
      <h2 class="label">
        Fills
      </h2>
      <p class="fill fill--jade">
        Text on jade
      </p>
      <p class="fill fill--jade-soft">
        Text on jade soft
      </p>
      <p class="fill fill--amber-soft">
        Text on amber soft
      </p>
    </section>

    <section>
      <h2 class="label">
        AppButton
      </h2>
      <div class="row">
        <AppButton variant="primary">
          Primary
        </AppButton>
        <AppButton variant="action">
          Action
        </AppButton>
        <AppButton variant="ghost">
          Ghost
        </AppButton>
        <AppButton
          variant="action"
          to="/"
        >
          Action link
        </AppButton>
      </div>
    </section>

    <section>
      <h2 class="label">
        MetricTile
      </h2>
      <div
        v-if="profile?.proofStrip?.[0]"
        class="row"
      >
        <MetricTile
          :value="profile.proofStrip[0].value"
          :label="profile.proofStrip[0].label"
        />
      </div>
    </section>

    <section>
      <h2 class="label">
        ProofStrip
      </h2>
      <ProofStrip
        v-if="profile?.proofStrip"
        :items="profile.proofStrip"
      />
    </section>

    <section>
      <h2 class="label">
        TagList
      </h2>
      <TagList
        v-if="cards[0]"
        :tags="cards[0].stack"
        label="Stack"
      />
    </section>

    <section>
      <h2 class="label">
        WorkCard
      </h2>
      <div class="cards">
        <WorkCard
          v-for="card in cards"
          :key="card.path"
          :to="card.path"
          :title="card.title"
          :summary="card.summary"
          :stack="card.stack"
          :metric="card.cardMetric"
          :period="card.period"
          :client="card.client"
        >
          <template
            v-if="card === cards[0]"
            #media
          >
            <div class="media-placeholder small">
              Media slot (image or diagram)
            </div>
          </template>
        </WorkCard>
      </div>
    </section>

    <section>
      <h2 class="label">
        QuoteBlock
      </h2>
      <QuoteBlock :quote="sampleQuote" />
      <p class="small">
        With <code>quote: null</code> nothing renders:
      </p>
      <QuoteBlock :quote="null" />
    </section>

    <section>
      <h2 class="label">
        Timeline
      </h2>
      <Timeline
        v-if="timeline"
        :jobs="timeline.jobs.slice(0, 2)"
      />
    </section>

    <section>
      <h2 class="label">
        ContactBlock
      </h2>
      <p class="small">
        Shows the email and the booking button after mount. Open
        <code>/_gallery?from=upwork</code> in a new tab to see the Upwork version.
      </p>
      <ContactBlock
        :upwork="siteProfile.links.upwork"
        :hours="siteProfile.hours"
        :reply-promise="siteProfile.replyPromise"
      />
    </section>

    <section v-if="profile">
      <h2 class="label">
        TimeOverlap
      </h2>
      <p class="small">
        Fills in your own time after mount. Narrow the window below 720 px to see the one-line phone version.
      </p>
      <div class="clock-sample">
        <TimeOverlap
          :city="profile.location.split(',')[0]?.trim() ?? ''"
          :utc-offset="profile.utcOffset"
          :start="profile.hours.start"
          :end="profile.hours.end"
        />
      </div>
    </section>
  </div>
</template>

<style scoped>
.clock-sample {
  max-width: 420px;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));
  gap: 16px;
}

.media-placeholder {
  display: grid;
  place-items: center;
  min-height: 120px;
  color: var(--muted);
}

.gallery {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding-block: 48px;
}

section {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 24px;
  border-top: 1px solid var(--line);
}

.swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  padding: 0;
  list-style: none;
}

.swatches li {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: var(--text-small);
}

.chip {
  height: 56px;
  border: 1px solid var(--line);
  border-radius: var(--radius);
}

.fill {
  padding: 10px 14px;
  border-radius: var(--radius);
}

.fill--jade {
  background: var(--jade);
  color: var(--on-jade);
}

.fill--jade-soft {
  background: var(--jade-soft);
  color: var(--ink);
}

.fill--amber-soft {
  background: var(--amber-soft);
  color: var(--ink);
  border: 1px solid var(--amber);
}
</style>
