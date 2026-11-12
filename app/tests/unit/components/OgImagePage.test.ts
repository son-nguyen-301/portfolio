// @vitest-environment happy-dom
// The link preview template (PF-021, D-037): it shows only the label, the
// heading, the result line, and Son's name, title and the site's host. It
// never shows a contact detail (CLAUDE.md hard rule 4).
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Page from '../../../app/components/OgImage/Page.takumi.vue'

const profile = {
  name: 'Sample Name',
  title: 'Sample Title',
  location: 'Sample City, Sample Country',
  hours: 'sample hours',
  replyPromise: 'I reply within a sample time.',
  links: { linkedin: 'https://example.com/in', github: 'https://example.com/gh', upwork: 'https://example.com/upwork' },
}

beforeEach(() => {
  vi.stubGlobal('useSiteProfile', () => profile)
  vi.stubGlobal('useSiteConfig', () => ({ url: 'https://sample.example.com' }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function lines(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('div').filter(div => div.findAll('div').length === 0).map(div => div.text())
}

describe('OgImage Page', () => {
  it('shows the label, the heading, the result line, the name, the title and the host', () => {
    const wrapper = mount(Page, { props: { label: 'Case study', title: 'A sample case study', metric: 'Sample result' } })
    expect(lines(wrapper)).toEqual(['', 'Case study', 'A sample case study', 'Sample result', 'Sample Name', 'Sample Title', 'sample.example.com'])
  })

  it('leaves out the result line when there is none', () => {
    const wrapper = mount(Page, { props: { label: 'Lab', title: 'Side projects' } })
    expect(lines(wrapper)).toEqual(['', 'Lab', 'Side projects', 'Sample Name', 'Sample Title', 'sample.example.com'])
  })

  it('never shows a link, the reply promise or the place', () => {
    const html = mount(Page, { props: { label: 'Lab', title: 'Side projects' } }).html()
    for (const value of [profile.replyPromise, profile.location, profile.hours, ...Object.values(profile.links), '@', 'mailto:']) {
      expect(html).not.toContain(value)
    }
  })
})
