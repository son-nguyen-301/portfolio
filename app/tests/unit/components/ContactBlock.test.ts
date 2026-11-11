// @vitest-environment happy-dom
// ContactBlock: the Upwork version in the built page, the email and the
// booking link only after mount on a normal visit.
import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { Component } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { createSSRApp, h } from 'vue'
import { contactDetailsPath } from '../../../app/utils/contact'
import { global } from './stubs'

const details = { email: 'sample@example.com', booking: { url: 'https://example.com/book', label: 'Book a sample call' } }
const props = { upwork: 'https://example.com/upwork', hours: '08:00 to 22:00 sample time', replyPromise: 'I reply within a sample time.' }

let fetcher: ReturnType<typeof vi.fn<typeof fetch>>

// useUpworkMode() keeps one value for the whole visit, so each test loads the
// component fresh.
async function loadBlock(): Promise<Component> {
  vi.resetModules()
  return (await import('../../../app/components/ContactBlock.vue')).default
}

async function mountBlock() {
  const wrapper = mount(await loadBlock(), { props, global, attachTo: document.body })
  await flushPromises()
  return wrapper
}

let wrapper: Awaited<ReturnType<typeof mountBlock>> | undefined

beforeEach(() => {
  fetcher = vi.fn<typeof fetch>(async () => new Response(JSON.stringify(details)))
  vi.stubGlobal('fetch', fetcher)
  window.sessionStorage.clear()
  window.history.replaceState(null, '', '/')
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllGlobals()
  vi.useRealTimers()
  document.documentElement.removeAttribute('data-upwork')
})

describe('ContactBlock', () => {
  it('renders only the Upwork version on the server', async () => {
    const block = await loadBlock()
    const html = await renderToString(createSSRApp({ render: () => h(block, props) }).component('NuxtLink', global.components.NuxtLink))
    expect(html).toContain('Message me on Upwork')
    expect(html).toContain(props.upwork)
    expect(html).toContain(props.replyPromise)
    expect(html).toContain(`I work ${props.hours}.`)
    expect(html).not.toContain('@')
    expect(html).not.toContain(details.booking.url)
    expect(fetcher).not.toHaveBeenCalled()
  })

  it('shows the booking button and the email after mount on a normal visit', async () => {
    wrapper = await mountBlock()
    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher.mock.calls[0]![0]).toBe(contactDetailsPath)
    expect(wrapper.find('a[href="https://example.com/book"]').text()).toBe(details.booking.label)
    expect(wrapper.find('.contact-block__email').text()).toBe(details.email)
    expect(wrapper.text()).not.toContain('Message me on Upwork')
    expect(wrapper.text()).toContain(props.replyPromise)
  })

  it('keeps the Upwork version and downloads nothing in Upwork mode', async () => {
    window.history.replaceState(null, '', '/?from=upwork')
    wrapper = await mountBlock()
    expect(fetcher).not.toHaveBeenCalled()
    expect(wrapper.find('a').attributes('href')).toBe(props.upwork)
    expect(wrapper.html()).not.toContain('@')
  })

  it('keeps Upwork mode from an earlier page of the visit', async () => {
    window.sessionStorage.setItem('upwork', '1')
    wrapper = await mountBlock()
    expect(fetcher).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('Message me on Upwork')
  })

  it('keeps the Upwork version when the file does not load', async () => {
    fetcher.mockImplementation(async () => new Response('Not found', { status: 404 }))
    wrapper = await mountBlock()
    expect(fetcher).toHaveBeenCalledOnce()
    expect(wrapper.text()).toContain('Message me on Upwork')
  })

  it('copies the email and shows "Copied" for 2 seconds', async () => {
    const writeText = vi.fn(async () => {})
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    wrapper = await mountBlock()
    vi.useFakeTimers()
    const button = wrapper.find('button.contact-block__copy')
    expect(button.text()).toBe('Copy email')
    expect(button.attributes('aria-live')).toBe('polite')
    await button.trigger('click')
    await flushPromises()
    expect(writeText).toHaveBeenCalledWith(details.email)
    expect(button.text()).toBe('Copied')
    await vi.advanceTimersByTimeAsync(1999)
    expect(button.text()).toBe('Copied')
    await vi.advanceTimersByTimeAsync(1)
    expect(button.text()).toBe('Copy email')
  })

  it('selects the email when the clipboard is blocked', async () => {
    const writeText = vi.fn(async () => {
      throw new DOMException('Blocked', 'NotAllowedError')
    })
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } })
    wrapper = await mountBlock()
    await wrapper.find('button.contact-block__copy').trigger('click')
    await flushPromises()
    expect(window.getSelection()?.toString()).toBe(details.email)
    expect(wrapper.find('button.contact-block__copy').text()).toBe('Copy email')
  })

  it('selects the email when there is no clipboard', async () => {
    vi.stubGlobal('navigator', { ...navigator, clipboard: undefined })
    wrapper = await mountBlock()
    await wrapper.find('button.contact-block__copy').trigger('click')
    await flushPromises()
    expect(window.getSelection()?.toString()).toBe(details.email)
  })
})
