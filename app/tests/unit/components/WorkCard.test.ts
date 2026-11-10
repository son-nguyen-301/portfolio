// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import WorkCard from '../../../app/components/WorkCard.vue'
import { global } from './stubs'

const props = {
  to: '/work/sample-case',
  title: 'Sample title',
  summary: 'Sample summary',
  stack: ['Nuxt 4', 'Vue 3'],
  metric: 'Sample metric',
}

describe('WorkCard', () => {
  it('is one link that holds the whole card', () => {
    const wrapper = mount(WorkCard, { props, global, slots: { media: '<div class="sample-media">media</div>' } })
    const root = wrapper.element as HTMLElement
    expect(root.tagName).toBe('A')
    expect(root.getAttribute('href')).toBe('/work/sample-case')
    // Exactly one link and no button, so the card is one tap target.
    expect(wrapper.findAll('a')).toHaveLength(1)
    expect(wrapper.findAll('button')).toHaveLength(0)
    // Media, result line, title, summary and tags are all inside the link.
    for (const text of ['media', 'Sample metric', 'Sample title', 'Sample summary', 'Nuxt 4', 'Vue 3']) {
      expect(root.textContent).toContain(text)
    }
  })

  it('shows the title as an h3 by default, or the heading it is given', () => {
    expect(mount(WorkCard, { props, global }).find('h3').text()).toBe('Sample title')
    const asH2 = mount(WorkCard, { props: { ...props, heading: 'h2' as const }, global })
    expect(asH2.find('h2').text()).toBe('Sample title')
    expect(asH2.find('h3').exists()).toBe(false)
  })

  it('leaves out the result line and the media box when they are missing', () => {
    const wrapper = mount(WorkCard, { props: { ...props, metric: undefined }, global })
    expect(wrapper.find('.work-card__metric').exists()).toBe(false)
    expect(wrapper.find('.work-card__media').exists()).toBe(false)
  })

  it('lists the stack as tags', () => {
    const wrapper = mount(WorkCard, { props, global })
    const tags = wrapper.find('ul[aria-label="Stack"]')
    expect(tags.findAll('li').map(li => li.text())).toEqual(['Nuxt 4', 'Vue 3'])
  })
})
