// The few profile fields that the header and footer show on every page.
// They reach the browser through app config (modules/site-profile.ts), so the
// layout never runs a content query. A query in the browser downloads the whole
// profile collection, the email and the booking link included (CLAUDE.md hard
// rule 4). Every field is named here on purpose: never spread the profile.
import type { Profile } from './content/schemas'

export interface SiteProfile {
  name: string
  title: string
  location: string
  // profile.hours.label
  hours: string
  replyPromise: string
  links: { linkedin: string, github: string, upwork: string }
  // profile.siteStats, without the day: the footer's stats line.
  stats: { lighthouse: number, javascriptKb: number }
}

export function pickSiteProfile(profile: Profile): SiteProfile {
  return {
    name: profile.name,
    title: profile.title,
    location: profile.location,
    hours: profile.hours.label,
    replyPromise: profile.replyPromise,
    links: {
      linkedin: profile.links.linkedin,
      github: profile.links.github,
      upwork: profile.links.upwork,
    },
    stats: {
      lighthouse: profile.siteStats.lighthouse,
      javascriptKb: profile.siteStats.javascriptKb,
    },
  }
}
