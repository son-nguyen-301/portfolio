// The link preview image of a page (PF-021, D-037). Pages call this once in
// setup with their label, heading and, on case studies, the result line. The
// name and job title come from app config (useSiteProfile), never the email or
// the booking link (CLAUDE.md hard rule 4), and the host from the site config.
// `ogImageArgs()` (app/utils/og.ts) builds the props and the alt text, and
// stops the build if the label or the heading is missing. The build renders
// app/components/OgImage/PageCard.takumi.vue into a PNG.
import type { OgCard } from '~/utils/og'

export function usePageOgImage(card: OgCard): void {
  // The images are drawn only in the build, so the browser has nothing to do.
  if (import.meta.client) return
  const { props, alt } = ogImageArgs(card, useSiteProfile(), useSiteConfig().url)
  defineOgImage('PageCard', props, { alt })
}
