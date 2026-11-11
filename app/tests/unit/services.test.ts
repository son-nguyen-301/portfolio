// The helpers of the services page (app/utils/services.ts, PF-015).
import { describe, expect, it } from 'vitest'
import { orList, proofLinks, serviceGroups } from '../../app/utils/services'

const item = (id: string, group: string, proof: string[] = ['a']) => ({ id, group, title: id, summary: id, proof })

describe('serviceGroups', () => {
  it('puts each service under its group, in the order of `groups`', () => {
    const groups = [{ name: 'Frontend', note: 'F' }, { name: 'AI', note: 'A' }, { name: 'Lead', note: 'L' }]
    const items = [item('speed', 'Frontend'), item('ai', 'AI'), item('tests', 'Frontend'), item('lead', 'Lead')]
    expect(serviceGroups(groups, items).map(group => [group.name, group.note, group.items.map(entry => entry.id)])).toEqual([
      ['Frontend', 'F', ['speed', 'tests']],
      ['AI', 'A', ['ai']],
      ['Lead', 'L', ['lead']],
    ])
  })

  it('leaves out a group with no service', () => {
    expect(serviceGroups([{ name: 'AI', note: '' }, { name: 'Lead', note: '' }], [item('lead', 'Lead')]).map(group => group.name)).toEqual(['Lead'])
  })
})

describe('proofLinks', () => {
  const studies = [
    { path: '/work/one', title: 'One' },
    { path: '/work/two', title: 'Two, with a comma' },
  ]

  it('gives the path and title of each case study, in the order the service names them', () => {
    expect(proofLinks(['two', 'one'], studies)).toEqual([
      { path: '/work/two', title: 'Two, with a comma' },
      { path: '/work/one', title: 'One' },
    ])
  })

  it('throws on a slug with no case study', () => {
    expect(() => proofLinks(['one', 'three'], studies)).toThrow('No case study "/work/three"')
  })
})

describe('orList', () => {
  it('joins one, two or more items', () => {
    expect(orList([])).toBe('')
    expect(orList(['A'])).toBe('A')
    expect(orList(['A', 'B'])).toBe('A or B')
    expect(orList(['A', 'B (x, y)', 'C'])).toBe('A, B (x, y), or C')
  })
})
