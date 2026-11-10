// @vitest-environment happy-dom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import Timeline from '../../../app/components/Timeline.vue'
import type { Timeline as TimelineContent } from '../../../shared/content/schemas'

const jobs: TimelineContent['jobs'] = [
  {
    company: 'Company A',
    role: 'Role A',
    type: 'Type A',
    start: '2024-09',
    end: null,
    location: 'Place A',
    points: ['Point A1', 'Point A2'],
  },
  {
    company: 'Company B',
    role: 'Role B',
    start: '2022-05',
    end: '2026-07',
    location: 'Place B',
    points: ['Point B1'],
  },
]

describe('Timeline', () => {
  const wrapper = mount(Timeline, { props: { jobs } })
  const entries = wrapper.findAll('ol > li')

  it('shows one entry per job, in the given order', () => {
    expect(entries).toHaveLength(2)
    expect(entries.map(entry => entry.find('h3').text())).toEqual(['Role A', 'Role B'])
  })

  it('writes dates as "Sep 2024 to now" and "May 2022 to Jul 2026"', () => {
    expect(entries[0]!.find('.timeline__when').text()).toBe('Sep 2024 to now')
    expect(entries[1]!.find('.timeline__when').text()).toBe('May 2022 to Jul 2026')
  })

  it('puts the machine-readable month on each <time>', () => {
    expect(entries[0]!.findAll('time').map(time => time.attributes('datetime'))).toEqual(['2024-09'])
    expect(entries[1]!.findAll('time').map(time => time.attributes('datetime'))).toEqual(['2022-05', '2026-07'])
  })

  it('shows the company, place, type and points', () => {
    expect(entries[0]!.find('.timeline__place').text()).toBe('Company A · Place A')
    expect(entries[0]!.find('.timeline__type').text()).toBe('Type A')
    expect(entries[0]!.findAll('.timeline__points li').map(li => li.text())).toEqual(['Point A1', 'Point A2'])
    expect(entries[1]!.find('.timeline__type').exists()).toBe(false)
  })
})
