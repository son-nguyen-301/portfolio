import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { formatMonth } from '../../app/utils/dates'

describe('formatMonth', () => {
  it('writes a YYYY-MM month as a short month and the year', () => {
    expect(formatMonth('2024-09')).toBe('Sep 2024')
    expect(formatMonth('2015-01')).toBe('Jan 2015')
    expect(formatMonth('2026-12')).toBe('Dec 2026')
  })

  it('throws on anything that is not YYYY-MM', () => {
    for (const value of ['2024-13', '2024-00', '2024-9', '24-09', 'Sep 2024', '', '2024-09-01']) {
      expect(() => formatMonth(value), value).toThrow()
    }
  })

  it('formats every date in timeline.yml', () => {
    const timeline = parse(readFileSync(new URL('../../content/timeline.yml', import.meta.url), 'utf8')) as {
      jobs: Array<{ start: string, end: string | null }>
      education: Array<{ start: string, end: string }>
    }
    for (const entry of [...timeline.jobs, ...timeline.education]) {
      expect(formatMonth(entry.start)).toMatch(/^[A-Z][a-z]{2} \d{4}$/)
      if (entry.end) expect(formatMonth(entry.end)).toMatch(/^[A-Z][a-z]{2} \d{4}$/)
    }
  })
})
