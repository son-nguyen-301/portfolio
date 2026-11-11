// The helpers of the about page (app/utils/about.ts, PF-016).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { aboutText, companyJob, yearSpan } from '../../app/utils/about'

const read = (file: string) => parse(readFileSync(fileURLToPath(new URL(`../../content/${file}`, import.meta.url)), 'utf8'))

describe('aboutText', () => {
  it('takes the first sentence as the headline and keeps the rest as paragraphs', () => {
    expect(aboutText('One two. Three four.\n\nFive six.\n\nSeven.\n')).toEqual({
      headline: 'One two',
      paragraphs: ['Three four.', 'Five six.', 'Seven.'],
    })
  })

  it('drops an empty rest when the first paragraph is one sentence', () => {
    expect(aboutText('Only this.\n\nNext one.')).toEqual({ headline: 'Only this', paragraphs: ['Next one.'] })
  })

  it('joins lines inside a paragraph and ignores extra blank lines', () => {
    expect(aboutText('A b.\nC\nd.\n\n\n\nE f.')).toEqual({ headline: 'A b', paragraphs: ['C d.', 'E f.'] })
  })

  it('throws when there is no first sentence', () => {
    expect(() => aboutText('No full stop here')).toThrow('first sentence')
    expect(() => aboutText('')).toThrow('first sentence')
  })

  it('splits the real about text so no word is lost', () => {
    const { about } = read('profile.yml') as { about: string }
    const { headline, paragraphs } = aboutText(about)
    expect(headline).toBe('I have built web apps with Vue since 2019')
    const words = (text: string) => text.split(/\s+/).filter(Boolean)
    expect(words(`${headline}. ${paragraphs.join(' ')}`)).toEqual(words(about))
  })
})

describe('companyJob', () => {
  const jobs = [
    { company: 'A', start: '2024-09', end: null },
    { company: 'B', start: '2019-04', end: '2021-07' },
  ]

  it('finds the job by its company', () => {
    expect(companyJob(jobs, 'B')).toBe(jobs[1])
  })

  it('throws on a company with no job', () => {
    expect(() => companyJob(jobs, 'C')).toThrow('No job at "C"')
  })

  it('finds the two companies the about page names in its headings', () => {
    const { jobs: real } = read('timeline.yml') as { jobs: Array<{ company: string, start: string, end: string | null }> }
    expect(companyJob(real, 'Aspire').company).toBe('Aspire')
    expect(companyJob(real, 'XTEL').company).toBe('XTEL')
  })
})

describe('yearSpan', () => {
  it('writes the years of a job', () => {
    expect(yearSpan({ start: '2019-04', end: '2021-07' })).toBe('2019 to 2021')
    expect(yearSpan({ start: '2024-09', end: null })).toBe('2024 to now')
  })
})
