// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import LabCard from '../../../app/components/LabCard.vue'
import { global } from './stubs'

// NuxtImg renders a plain <img> on the built site.
const NuxtImgStub = defineComponent({
  name: 'NuxtImg',
  props: { src: String, alt: String, width: String, height: String, loading: String },
  setup: props => () => h('img', { src: props.src, alt: props.alt, width: props.width, height: props.height, loading: props.loading }),
})
const stubs = { global: { components: { ...global.components, NuxtImg: NuxtImgStub } } }
const DiagramSample = defineComponent({
  props: { title: String },
  setup: props => () => h('svg', { class: 'sample-diagram', role: 'img' }, [h('title', props.title)]),
})

const props = {
  name: 'Sample project',
  summary: 'Sample summary',
  status: 'Live',
  stack: ['Nuxt 4', 'Vue 3'],
  media: { type: 'image' as const, alt: 'TODO: screenshot of the sample' },
}

describe('LabCard', () => {
  it('shows the name, status, summary and stack, and no link when there is none', () => {
    const wrapper = mount(LabCard, { ...stubs, props })
    expect(wrapper.find('h3').text()).toBe('Sample project')
    expect(wrapper.find('.lab-card__status').text()).toBe('Live')
    expect(wrapper.find('.lab-card__status').classes()).toContain('lab-card__status--live')
    expect(wrapper.find('.lab-card__summary').text()).toBe('Sample summary')
    expect(wrapper.findAll('[aria-label="Stack"] li').map(li => li.text())).toEqual(['Nuxt 4', 'Vue 3'])
    expect(wrapper.findAll('a')).toHaveLength(0)
  })

  it('links out when the project has a link', () => {
    const wrapper = mount(LabCard, { ...stubs, props: { ...props, link: 'https://github.com/sample/repo', heading: 'h2' as const } })
    expect(wrapper.find('h2').text()).toBe('Sample project')
    const links = wrapper.findAll('a')
    expect(links).toHaveLength(1)
    expect(links[0]!.attributes('href')).toBe('https://github.com/sample/repo')
    expect(links[0]!.text()).toBe('See it on GitHub →')
  })

  it('gives a project still being built the amber tag', () => {
    const wrapper = mount(LabCard, { ...stubs, props: { ...props, status: 'Build in progress' } })
    expect(wrapper.find('.lab-card__status').classes()).toContain('lab-card__status--building')
  })

  it('shows a placeholder, never the TODO note, for a screenshot that is not ready', () => {
    const wrapper = mount(LabCard, { ...stubs, props })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('[data-media="placeholder"]').text()).toBe('Screenshot coming')
    expect(wrapper.text()).not.toContain('TODO')
    expect(wrapper.html()).not.toContain('TODO')
  })

  it('shows a ready image lazily at a fixed size', () => {
    const wrapper = mount(LabCard, { ...stubs, props: { ...props, media: { type: 'image', src: '/images/shot.png', alt: 'The home screen' } } })
    expect(wrapper.find('img').attributes()).toMatchObject({ src: '/images/shot.png', alt: 'The home screen', width: '960', height: '540', loading: 'lazy' })
  })

  it('shows a diagram with the alt text as its title, and no role around it', () => {
    const wrapper = mount(LabCard, {
      ...stubs,
      props: { ...props, media: { type: 'diagram', src: 'DiagramSample', alt: 'Issue to merge' }, diagrams: { DiagramSample } },
    })
    expect(wrapper.find('svg.sample-diagram title').text()).toBe('Issue to merge')
    expect(wrapper.findAll('[role="img"]')).toHaveLength(1)
    expect(wrapper.find('[data-media="diagram"]').attributes('role')).toBeUndefined()
  })
})
