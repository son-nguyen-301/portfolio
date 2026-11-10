// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import QuoteBlock from '../../../app/components/QuoteBlock.vue'

describe('QuoteBlock', () => {
  it('renders nothing when the quote is null', () => {
    const wrapper = mount(QuoteBlock, { props: { quote: null } })
    expect(wrapper.find('figure').exists()).toBe(false)
    expect(wrapper.text()).toBe('')
    // Only Vue's empty placeholder comment is left.
    expect(wrapper.html()).toBe('<!--v-if-->')
  })

  it('renders the quote and the role', () => {
    const wrapper = mount(QuoteBlock, { props: { quote: { text: 'Quote text', role: 'Role text' } } })
    expect(wrapper.find('figure blockquote').text()).toBe('Quote text')
    expect(wrapper.find('figure figcaption').text()).toBe('Role text')
  })
})
