// The profile fields that every page gets through app config (shared/site-profile.ts).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { profileSchema } from '../../shared/content/schemas'
import { pickSiteProfile } from '../../shared/site-profile'

const file = fileURLToPath(new URL('../../content/profile.yml', import.meta.url))
const profile = profileSchema.parse(parse(readFileSync(file, 'utf8')))

describe('pickSiteProfile', () => {
  it('takes only the header and footer fields', () => {
    const picked = pickSiteProfile(profile)
    expect(Object.keys(picked).sort()).toEqual(['hours', 'links', 'location', 'name', 'replyPromise', 'stats', 'title'])
    expect(Object.keys(picked.links).sort()).toEqual(['github', 'linkedin', 'upwork'])
    expect(picked.name).toBe(profile.name)
    expect(picked.hours).toBe(profile.hours.label)
    expect(picked.stats).toEqual({ lighthouse: profile.siteStats.lighthouse, javascriptKb: profile.siteStats.javascriptKb })
  })

  it('never holds the email or the booking link', () => {
    const text = JSON.stringify(pickSiteProfile(profile))
    expect(text).not.toContain(profile.email)
    expect(text).not.toContain(profile.booking.url)
  })
})
