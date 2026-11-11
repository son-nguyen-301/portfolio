// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { defineComponent, h } from 'vue'
import { describe, expect, it } from 'vitest'
import CaseStudyMedia from '../../../app/components/CaseStudyMedia.vue'
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

describe('CaseStudyMedia', () => {
  it('shows a placeholder, with the alt text as caption, for a screenshot that is a TODO', () => {
    const wrapper = mount(CaseStudyMedia, {
      ...stubs,
      props: { items: [{ type: 'image', alt: 'Room home page', caption: 'TODO: screenshot from staging' }] },
    })
    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.case-media__placeholder').text()).toBe('Screenshot coming')
    expect(wrapper.find('figcaption').text()).toBe('Room home page')
    expect(wrapper.text()).not.toContain('TODO')
  })

  it('shows a real image lazily at a fixed size, with its caption', () => {
    const wrapper = mount(CaseStudyMedia, {
      ...stubs,
      props: { items: [{ type: 'image', src: '/images/shot.png', alt: 'The new screen', caption: 'After the change' }] },
    })
    const img = wrapper.find('img')
    expect(img.attributes()).toMatchObject({ src: '/images/shot.png', alt: 'The new screen', width: '960', height: '600', loading: 'lazy' })
    expect(wrapper.find('figcaption').text()).toBe('After the change')
  })

  it('shows a diagram component by name, or a placeholder until it exists', () => {
    const items = [
      { type: 'diagram' as const, src: 'DiagramSample', alt: 'A flow' },
      { type: 'diagram' as const, src: 'DiagramMissing', alt: 'Another flow' },
    ]
    const wrapper = mount(CaseStudyMedia, { ...stubs, props: { items, diagrams: { DiagramSample } } })
    const figures = wrapper.findAll('figure')
    expect(figures[0]!.find('.sample-diagram').exists()).toBe(true)
    expect(figures[0]!.findAll('[role="img"]')).toHaveLength(1)
    expect(figures[0]!.find('.sample-diagram title').text()).toBe('A flow')
    expect(figures[1]!.find('.case-media__placeholder').text()).toBe('Diagram coming')
    expect(figures[1]!.find('figcaption').text()).toBe('Another flow')
  })

  it('renders nothing with no items', () => {
    const wrapper = mount(CaseStudyMedia, { ...stubs, props: { items: [] } })
    expect(wrapper.find('figure').exists()).toBe(false)
  })
})
