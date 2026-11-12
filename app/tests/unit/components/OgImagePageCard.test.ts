// @vitest-environment happy-dom
// The link preview template (PF-021, D-037): it shows only the label, the
// heading, the result line, and Son's name, job title and the site's host.
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PageCard from '../../../app/components/OgImage/PageCard.takumi.vue'

// What usePageOgImage() adds to every page's card.
const site = { name: 'Sample Name', jobTitle: 'Sample Title', host: 'sample.example.com' }

function lines(wrapper: ReturnType<typeof mount>): string[] {
  return wrapper.findAll('div').filter(div => div.findAll('div').length === 0).map(div => div.text())
}

describe('OgImage PageCard', () => {
  it('shows the label, the heading, the result line, the name, the title and the host', () => {
    const wrapper = mount(PageCard, { props: { label: 'Case study', title: 'A sample case study', metric: 'Sample result', ...site } })
    expect(lines(wrapper)).toEqual(['', 'Case study', 'A sample case study', 'Sample result', 'Sample Name', 'Sample Title', 'sample.example.com'])
  })

  it('leaves out the result line when there is none', () => {
    const wrapper = mount(PageCard, { props: { label: 'Lab', title: 'Side projects', ...site } })
    expect(lines(wrapper)).toEqual(['', 'Lab', 'Side projects', 'Sample Name', 'Sample Title', 'sample.example.com'])
  })
})
