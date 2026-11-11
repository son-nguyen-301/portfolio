// @vitest-environment happy-dom
// AppButton, MetricTile, TagList and ProofStrip.
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import AppButton from '../../../app/components/AppButton.vue'
import MetricTile from '../../../app/components/MetricTile.vue'
import ProofStrip from '../../../app/components/ProofStrip.vue'
import TagList from '../../../app/components/TagList.vue'
import { global } from './stubs'

describe('AppButton', () => {
  it('is a button by default, in the primary style', () => {
    const wrapper = mount(AppButton, { slots: { default: 'Go' } })
    expect(wrapper.element.tagName).toBe('BUTTON')
    expect(wrapper.attributes('type')).toBe('button')
    expect(wrapper.classes()).toContain('app-button--primary')
    expect(wrapper.text()).toBe('Go')
  })

  it('is a link when `to` is set', () => {
    const wrapper = mount(AppButton, { props: { to: '/services', variant: 'action' }, slots: { default: 'Go' }, global })
    expect(wrapper.element.tagName).toBe('A')
    expect(wrapper.attributes('href')).toBe('/services')
    expect(wrapper.classes()).toContain('app-button--action')
  })

  it('has the three variants', () => {
    for (const variant of ['primary', 'action', 'ghost'] as const) {
      expect(mount(AppButton, { props: { variant } }).classes()).toContain(`app-button--${variant}`)
    }
  })
})

describe('MetricTile', () => {
  it('shows the value in mono jade and the label', () => {
    const wrapper = mount(MetricTile, { props: { value: '12 PRs', label: 'Sample label' } })
    expect(wrapper.find('.metric-tile__value').text()).toBe('12 PRs')
    expect(wrapper.find('.metric-tile__value').classes()).toContain('num')
    expect(wrapper.find('.metric-tile__label').text()).toBe('Sample label')
  })

  it('keeps each word of the value whole, so it wraps only at a space', () => {
    const wrapper = mount(MetricTile, { props: { value: 'Alpha, beta-gamma', label: 'Sample label' } })
    expect(wrapper.findAll('.metric-tile__word').map(word => word.text())).toEqual(['Alpha,', 'beta-gamma'])
    expect(wrapper.find('.metric-tile__value').element.textContent).toBe('Alpha, beta-gamma')
  })
})

describe('TagList', () => {
  it('lists each tag', () => {
    const wrapper = mount(TagList, { props: { tags: ['Nuxt 4', 'Vue 3'], label: 'Stack' } })
    expect(wrapper.attributes('aria-label')).toBe('Stack')
    expect(wrapper.findAll('li').map(li => li.text())).toEqual(['Nuxt 4', 'Vue 3'])
  })

  it('renders nothing for no tags', () => {
    expect(mount(TagList, { props: { tags: [] } }).find('ul').exists()).toBe(false)
  })
})

describe('ProofStrip', () => {
  it('shows one tile per fact, in order', () => {
    const items = [
      { value: 'A', label: 'Fact A' },
      { value: 'B', label: 'Fact B' },
      { value: 'C', label: 'Fact C' },
      { value: 'D', label: 'Fact D' },
    ]
    const wrapper = mount(ProofStrip, { props: { items } })
    const tiles = wrapper.findAll('li .metric-tile')
    expect(tiles.map(tile => tile.find('.metric-tile__value').text())).toEqual(['A', 'B', 'C', 'D'])
    expect(tiles.map(tile => tile.find('.metric-tile__label').text())).toEqual(['Fact A', 'Fact B', 'Fact C', 'Fact D'])
  })
})
