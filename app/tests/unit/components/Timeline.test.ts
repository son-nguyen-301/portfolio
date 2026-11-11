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

  it('uses the list layout unless told otherwise', () => {
    expect(wrapper.find('ol').classes()).toContain('timeline--list')
  })
})

describe('Timeline with education and the rows layout', () => {
  const education: TimelineContent['education'] = [
    { school: 'School A', field: 'Field A', start: '2015-09', end: '2018-09' },
  ]
  const wrapper = mount(Timeline, { props: { jobs, education, layout: 'rows' } })
  const entries = wrapper.findAll('ol > li')

  it('puts education after the jobs, in the same list', () => {
    expect(entries).toHaveLength(3)
    expect(entries.map(entry => entry.find('h3').text())).toEqual(['Role A', 'Role B', 'Field A'])
    expect(entries[2]!.classes()).toContain('timeline__entry--education')
  })

  it('shows the dates, field and school of a school', () => {
    const school = entries[2]!
    expect(school.find('.timeline__when').text()).toBe('Sep 2015 to Sep 2018')
    expect(school.findAll('time').map(time => time.attributes('datetime'))).toEqual(['2015-09', '2018-09'])
    expect(school.find('.timeline__place').text()).toBe('School A')
    expect(school.find('.timeline__points').exists()).toBe(false)
  })

  it('marks the list with the rows layout', () => {
    expect(wrapper.find('ol').classes()).toContain('timeline--rows')
  })
})
