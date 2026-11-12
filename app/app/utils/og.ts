// Link preview images (PF-021, D-037). Every page calls `usePageOgImage()`
// (app/composables/og.ts) with an `OgCard`, and the build renders
// app/components/OgImage/PageCard.takumi.vue into a 1200 x 630 PNG under
// /_og/s/. No imports from `shared/` (D-027), so a test can load it.
import { siteHost } from './cv'

// The size LinkedIn and Upwork expect (docs/architecture.md, Link previews).
// `ogImage.defaults` in nuxt.config.ts uses it.
export const ogImageSize = { width: 1200, height: 630 } as const

// What one preview image shows. Every word comes from content or is the page's
// own label or heading, as on the page (D-024). A page passes its content as it
// has it; usePageOgImage() stops the build if the label or the heading is gone.
export interface OgCard {
  // The small mono line at the top, such as "Case study".
  label?: string
  // The page heading.
  title?: string
  // Case studies only: the card's result line (`cardMetric`).
  metric?: string
}

// The renderer can't read the site's CSS, so the template takes its colors
// from here: the light theme values in app/assets/css/tokens.css.
// tests/unit/og.test.ts fails when one differs from that file.
export const ogColors = {
  paper: '#F5F7F8',
  ink: '#141A22',
  muted: '#5A6472',
  line: '#DCE1E6',
  jade: '#0D7663',
} as const

// The token each color copies, for the test.
export const ogColorTokens: Record<keyof typeof ogColors, string> = {
  paper: '--paper',
  ink: '--ink',
  muted: '--muted',
  line: '--line',
  jade: '--jade',
}

// The fonts, by the family names that nuxt.config.ts loads with `global: true`.
export const ogFonts = {
  display: 'Bricolage Grotesque',
  body: 'Inter',
  mono: 'JetBrains Mono',
} as const

// Google sends each family as one variable font file for all its weights.
// The renderer draws such a file at its default weight unless the `wght` axis
// is set, so a weight needs both properties.
export function ogWeight(weight: 400 | 500 | 600 | 700): { fontWeight: number, fontVariationSettings: string } {
  return { fontWeight: weight, fontVariationSettings: `'wght' ${weight}` }
}

// The image's alt text, from the same words it shows:
// "Case study: <title> · <result line> · Hai Son Nguyen".
export function ogImageAlt(card: { label: string, title: string, metric?: string }, name: string): string {
  return [`${card.label}: ${card.title}`, card.metric, name].filter(Boolean).join(' · ')
}

// The template's props and the alt text for one page (usePageOgImage()). Only
// the name and the job title come from the profile, and the host from the site
// URL. An image with no label or heading means a content field is gone, so it
// throws, and the build stops.
export function ogImageArgs(card: OgCard, profile: { name: string, title: string }, siteUrl: string) {
  if (!card.label || !card.title) {
    throw new Error(`usePageOgImage: the preview image needs a label and a heading (${JSON.stringify(card)})`)
  }
  const shown = { label: card.label, title: card.title, metric: card.metric }
  return {
    props: { ...shown, name: profile.name, jobTitle: profile.title, host: siteHost(siteUrl) },
    alt: ogImageAlt(shown, profile.name),
  }
}

// A long heading gets a smaller size, so it fits in three lines.
export function ogTitleSize(title: string): number {
  if (title.length <= 40) return 76
  if (title.length <= 70) return 64
  return 54
}
