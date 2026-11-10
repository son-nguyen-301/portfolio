<script setup lang="ts">
// Dev-only gallery of tokens, type and base styles (modules/dev-gallery.ts).
// Never built: `nuxt generate` has no /_gallery route.
useSeoMeta({ title: 'Gallery', robots: 'noindex, nofollow' })

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
  </div>
</template>

<style scoped>
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
