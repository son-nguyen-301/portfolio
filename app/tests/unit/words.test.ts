import { describe, expect, it } from 'vitest'
import { words } from '../../app/utils/words'

describe('words', () => {
  it('splits text at the spaces and keeps hyphens inside a word', () => {
    expect(words('fintech and e-commerce teams.')).toEqual(['fintech', 'and', 'e-commerce', 'teams.'])
  })

  it('drops empty parts from extra spaces', () => {
    expect(words('  two  words ')).toEqual(['two', 'words'])
    expect(words('')).toEqual([])
  })
})
