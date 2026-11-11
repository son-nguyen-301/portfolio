// @vitest-environment happy-dom
// TimeOverlap: the neutral version on the server, the visitor's details after
// mount, and an update every 30 seconds.
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createSSRApp, h, nextTick } from 'vue'
import { renderToString } from 'vue/server-renderer'
import TimeOverlap from '../../../app/components/TimeOverlap.vue'

// Son's hours from app/content/profile.yml.
const props = { city: 'Hanoi', utcOffset: 7, start: 8, end: 22 }

// Pretend the browser is at a UTC offset in hours, east positive.
function browserAt(offset: number, zone: string) {
  vi.spyOn(Date.prototype, 'getTimezoneOffset').mockReturnValue(-offset * 60)
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockReturnValue({ timeZone: zone } as Intl.ResolvedDateTimeFormatOptions)
}

let wrapper: ReturnType<typeof mount> | undefined

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
  vi.setSystemTime(new Date('2026-01-14T12:00:40Z'))
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.restoreAllMocks()
})

const sentence = () => wrapper!.find('.time-overlap__sentence > p:not([aria-hidden])').text()

describe('TimeOverlap', () => {
  it('renders the neutral version on the server', async () => {
    const html = await renderToString(createSSRApp({ render: () => h(TimeOverlap, props) }))
    expect(html).toContain('data-state="neutral"')
    expect(html).toContain('Hanoi, UTC+7 · 08:00 to 22:00')
    expect(html).toContain('My hours, 08:00 to 22:00 Hanoi')
    expect(html).not.toContain('We share')
    expect(html).not.toContain('time-overlap__now')
    expect(html).not.toContain('class="time-overlap__you"')
    // The jade part sits at Son's own 08:00 to 22:00.
    expect(html).toContain('left:33.33%;width:58.33%')
  })

  it('shows the shared hours in London after mount', async () => {
    browserAt(0, 'Europe/London')
    wrapper = mount(TimeOverlap, { props })
    await nextTick()
    expect(wrapper.attributes('data-state')).toBe('ready')
    expect(sentence()).toBe('We share 6 work hours each weekday: 09:00 to 15:00 your time.')
    const texts = (selector: string) => wrapper!.findAll(`${selector} p`).map(p => p.text())
    expect(texts('.time-overlap__clock:not(.time-overlap__clock--you)')).toEqual(['Hanoi now', '19:00'])
    expect(texts('.time-overlap__clock--you')).toEqual(['Your time · London', '12:00'])
    expect(texts('.time-overlap__line')).toEqual(['Shared work hours', '6 h · 09:00 to 15:00', 'Hanoi19:00'])
    expect(wrapper.find('.time-overlap__now').attributes('style')).toContain('left: 50%')
  })

  it('uses the sign of the browser offset the right way round', async () => {
    browserAt(-5, 'America/New_York')
    wrapper = mount(TimeOverlap, { props })
    await nextTick()
    expect(sentence()).toBe('We share 1 work hour each weekday: 09:00 to 10:00 your time.')
  })

  it('shows the no-overlap sentence in Los Angeles', async () => {
    browserAt(-8, 'America/Los_Angeles')
    wrapper = mount(TimeOverlap, { props })
    await nextTick()
    expect(sentence()).toBe('Our work days don\'t overlap. I send a written update before your day starts, and I can take calls at 06:00 your time.')
    expect(wrapper.findAll('.time-overlap__son')).toHaveLength(2)
  })

  it('says we are in the same time zone in Hanoi', async () => {
    browserAt(7, 'Asia/Ho_Chi_Minh')
    wrapper = mount(TimeOverlap, { props })
    await nextTick()
    expect(sentence()).toBe('We are in the same time zone.')
    expect(wrapper.find('.time-overlap__line').text()).toContain('Same time zone')
  })

  it('updates every 30 seconds and stops on unmount', async () => {
    browserAt(0, 'Europe/London')
    wrapper = mount(TimeOverlap, { props })
    await nextTick()
    const you = () => wrapper!.find('.time-overlap__clock--you .time-overlap__time').text()
    expect(you()).toBe('12:00')
    vi.advanceTimersByTime(29_000)
    await nextTick()
    expect(you()).toBe('12:00')
    vi.advanceTimersByTime(1_000)
    await nextTick()
    expect(you()).toBe('12:01')
    wrapper.unmount()
    wrapper = undefined
    expect(vi.getTimerCount()).toBe(0)
  })

  it('stays neutral if the browser gives an offset outside -12 to 14', async () => {
    browserAt(15, 'Etc/Unknown')
    wrapper = mount(TimeOverlap, { props })
    await nextTick()
    expect(wrapper.attributes('data-state')).toBe('neutral')
    expect(sentence()).toBe('Hanoi, UTC+7 · 08:00 to 22:00')
  })
})
