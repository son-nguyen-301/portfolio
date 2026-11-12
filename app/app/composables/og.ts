// The link preview image of a page (PF-021, D-037). Pages call this once in
// setup with their label, heading and, on case studies, the result line. The
// name and job title come from app config (useSiteProfile), never the email or
// the booking link (CLAUDE.md hard rule 4), and the host from the site config.
// The build renders app/components/OgImage/PageCard.takumi.vue into a PNG.
import type { OgCard } from '~/utils/og'
import { siteHost } from '~/utils/cv'

export function usePageOgImage(card: OgCard): void {
  // An image with no heading means a content field is gone: stop the build.
  if (!card.label || !card.title) {
    throw new Error(`usePageOgImage: the preview image needs a label and a heading (${JSON.stringify(card)})`)
  }
  const profile = useSiteProfile()
  defineOgImage('PageCard', {
    label: card.label,
    title: card.title,
    metric: card.metric,
    name: profile.name,
    jobTitle: profile.title,
    host: siteHost(useSiteConfig().url),
  })
}
