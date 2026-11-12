// Read the content collections (see content.config.ts and docs/content-model.md).
// Pages and components read content only through these.
import type { ProfileCollectionItem } from '@nuxt/content'
import type { SiteProfile } from '#shared/site-profile'

declare module 'nuxt/schema' {
  interface AppConfig {
    // Set at build time by modules/site-profile.ts.
    siteProfile: SiteProfile
  }
}

// The profile fields the header and footer show: name, title, location, hours,
// reply promise and the LinkedIn, GitHub and Upwork links. They come from app
// config, not a content query, so they work on every page, 404.html too.
// Never the email or the booking link.
export function useSiteProfile(): SiteProfile {
  return useAppConfig().siteProfile
}

// Only the profile fields you name. A page's data is written into its built
// files, and profile.yml holds the email and the booking link, which must never
// reach a page opened from Upwork (CLAUDE.md hard rule 4). So name only the
// fields the page shows, and never `email` or `booking`: ContactBlock gets
// those from /contact-details.json (app/utils/contact.ts, D-021). The build has
// no browser copy of the profile collection, so this works at build time only.
export function useProfile<const Field extends keyof ProfileCollectionItem>(...fields: [Field, ...Field[]]) {
  return useAsyncData(`content:profile:${fields.join(',')}`, () => queryCollection('profile').select(...fields).first())
}

export function useServices() {
  return useAsyncData('content:services', () => queryCollection('services').first())
}

export function useTimeline() {
  return useAsyncData('content:timeline', () => queryCollection('timeline').first())
}

export function useSkills() {
  return useAsyncData('content:skills', () => queryCollection('skills').first())
}

export function useEarlier() {
  return useAsyncData('content:earlier', () => queryCollection('earlier').first())
}

// All case studies, in their `order`.
export function useCaseStudies() {
  return useAsyncData('content:work', () => queryCollection('work').order('order', 'ASC').all())
}

// The fields a case study card shows, for every case study in its `order`.
// No body, so a page that lists cards stays small.
export function useWorkCards() {
  return useAsyncData('content:work:cards', () => queryCollection('work')
    .select('path', 'title', 'summary', 'client', 'period', 'stack', 'cardMetric', 'featured', 'quote', 'order')
    .order('order', 'ASC')
    .all())
}

// The path and title of every case study, in `order`, for the previous and
// next links and the "1 of 6" line on a case study page.
export function useWorkNav() {
  return useAsyncData('content:work:nav', () => queryCollection('work')
    .select('path', 'title', 'order')
    .order('order', 'ASC')
    .all())
}

// One case study by its page path, for example "/work/aspire-redesign".
export function useCaseStudy(path: string) {
  return useAsyncData(`content:work:${path}`, () => queryCollection('work').path(path).first())
}

// All Lab projects, in their `order`.
export function useLabProjects() {
  return useAsyncData('content:lab', () => queryCollection('lab').order('order', 'ASC').all())
}
