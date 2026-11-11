// Time overlap math: useTimeOverlap() and formatClock().
import { describe, expect, it } from 'vitest'
import { formatClock, useTimeOverlap } from '../../app/composables/useTimeOverlap'

// The shared windows as "HH:MM to HH:MM", easy to read in a failing test.
function shared(visitorOffset: number) {
  const result = useTimeOverlap(visitorOffset)
  return {
    hours: result.hours,
    windows: result.windows.map(w => `${formatClock(w.start)} to ${formatClock(w.end)}`),
  }
}

describe('useTimeOverlap with Son\'s hours (08:00 to 22:00, UTC+7) and a 9-to-5 visitor', () => {
  // The zones from docs/architecture.md (Composables) and docs/brief.md (Working hours).
  const cases: { zone: string, offset: number, hours: number, windows: string[] }[] = [
    { zone: 'UTC+7 (Hanoi, Bangkok)', offset: 7, hours: 8, windows: ['09:00 to 17:00'] },
    { zone: 'UTC+0 (UK in winter)', offset: 0, hours: 6, windows: ['09:00 to 15:00'] },
    { zone: 'UTC+1 (Central Europe in winter)', offset: 1, hours: 7, windows: ['09:00 to 16:00'] },
    { zone: 'UTC-5 (US East in winter)', offset: -5, hours: 1, windows: ['09:00 to 10:00'] },
    { zone: 'UTC-8 (US West in winter)', offset: -8, hours: 0, windows: [] },
    { zone: 'UTC+13 (New Zealand in summer)', offset: 13, hours: 3, windows: ['14:00 to 17:00'] },
    { zone: 'UTC+5:30 (India)', offset: 5.5, hours: 8, windows: ['09:00 to 17:00'] },
  ]

  for (const c of cases) {
    it(`${c.zone}: ${c.hours} shared hours`, () => {
      expect(shared(c.offset)).toEqual({ hours: c.hours, windows: c.windows })
    })
  }

  it('shows Son\'s hours in the visitor\'s time, crossing midnight where they do', () => {
    // US West: 08:00 Hanoi is 17:00 the day before, 22:00 Hanoi is 07:00.
    expect(useTimeOverlap(-8).son).toEqual({ start: 17, end: 7, hours: 14 })
    // UK: 01:00 to 15:00, no midnight.
    expect(useTimeOverlap(0).son).toEqual({ start: 1, end: 15, hours: 14 })
    // India: 06:30 to 20:30.
    expect(useTimeOverlap(5.5).son).toEqual({ start: 6.5, end: 20.5, hours: 14 })
  })

  it('returns the visitor\'s workday as given', () => {
    expect(useTimeOverlap(0).visitor).toEqual({ start: 9, end: 17, hours: 8 })
  })
})

describe('useTimeOverlap with other hours', () => {
  it('handles a 45-minute zone (UTC+5:45, Nepal)', () => {
    // Son's 08:00 to 22:00 is 06:45 to 20:45 there.
    expect(shared(5.75)).toEqual({ hours: 8, windows: ['09:00 to 17:00'] })
    expect(useTimeOverlap(5.75).son).toEqual({ start: 6.75, end: 20.75, hours: 14 })
  })

  it('handles a half-hour zone that cuts the window (UTC-3:30, Newfoundland)', () => {
    // Son's hours are 21:30 to 11:30 there, so the shared time is 09:00 to 11:30.
    expect(shared(-3.5)).toEqual({ hours: 2.5, windows: ['09:00 to 11:30'] })
  })

  it('handles the far ends of the offsets (UTC-12 and UTC+14)', () => {
    // UTC-12: Son's hours are 13:00 to 03:00, so the shared time is 13:00 to 17:00.
    expect(shared(-12)).toEqual({ hours: 4, windows: ['13:00 to 17:00'] })
    // UTC+14: Son's hours are 15:00 to 05:00, so the shared time is 15:00 to 17:00.
    expect(shared(14)).toEqual({ hours: 2, windows: ['15:00 to 17:00'] })
  })

  it('handles a visitor workday that crosses midnight', () => {
    // A night shift from 20:00 to 04:00 at UTC+0. Son's hours are 01:00 to 15:00 there.
    const result = useTimeOverlap(0, 8, 22, 7, 20, 4)
    expect(result.visitor).toEqual({ start: 20, end: 4, hours: 8 })
    expect(result.hours).toBe(3)
    expect(result.windows).toEqual([{ start: 1, end: 4, hours: 3 }])
  })

  it('gives one window that crosses midnight when the shared time does', () => {
    // A night shift from 20:00 to 04:00 at UTC-8. Son's hours are 17:00 to 07:00 there.
    const result = useTimeOverlap(-8, 8, 22, 7, 20, 4)
    expect(result.hours).toBe(8)
    expect(result.windows).toEqual([{ start: 20, end: 4, hours: 8 }])
  })

  it('gives two windows when the shared time sits on both sides of the visitor\'s day', () => {
    // Son works 20:00 to 10:00 at UTC+0 and the visitor 08:00 to 22:00 at UTC+0:
    // they share 08:00 to 10:00 and 20:00 to 22:00.
    const result = useTimeOverlap(0, 20, 10, 0, 8, 22)
    expect(result.hours).toBe(4)
    expect(result.windows.map(w => `${formatClock(w.start)} to ${formatClock(w.end)}`)).toEqual([
      '08:00 to 10:00',
      '20:00 to 22:00',
    ])
  })

  it('treats 0 to 24 as the whole day and the same start and end as no time', () => {
    expect(useTimeOverlap(0, 0, 24, 0).hours).toBe(8)
    expect(useTimeOverlap(0, 0, 24, 0, 0, 24)).toMatchObject({ hours: 24, windows: [{ start: 0, end: 0, hours: 24 }] })
    expect(useTimeOverlap(0, 0, 24, 0, 18, 6).windows).toEqual([{ start: 18, end: 6, hours: 12 }])
    expect(useTimeOverlap(0, 9, 9, 0)).toMatchObject({ hours: 0, windows: [], son: { hours: 0 } })
  })

  it('does not count windows that only touch', () => {
    // Son ends at 09:00 visitor time, just as the visitor starts.
    expect(useTimeOverlap(0, 1, 9, 0)).toMatchObject({ hours: 0, windows: [] })
  })

  it('throws on a value that is not a valid hour or offset', () => {
    expect(() => useTimeOverlap(Number.NaN)).toThrow(RangeError)
    expect(() => useTimeOverlap(15)).toThrow(/visitorOffset/)
    expect(() => useTimeOverlap(-13)).toThrow(/visitorOffset/)
    expect(() => useTimeOverlap(0, 25)).toThrow(/sonStart/)
    expect(() => useTimeOverlap(0, 8, -1)).toThrow(/sonEnd/)
    expect(() => useTimeOverlap(0, 8, 22, Number.POSITIVE_INFINITY)).toThrow(/sonOffset/)
    expect(() => useTimeOverlap(0, 8, 22, 7, 24.5)).toThrow(/visitorStart/)
    expect(() => useTimeOverlap(0, 8, 22, 7, 9, Number.NaN)).toThrow(/visitorEnd/)
  })
})

describe('formatClock', () => {
  it('writes clock hours as HH:MM', () => {
    expect(formatClock(0)).toBe('00:00')
    expect(formatClock(9)).toBe('09:00')
    expect(formatClock(9.5)).toBe('09:30')
    expect(formatClock(6.75)).toBe('06:45')
    expect(formatClock(23.99)).toBe('23:59')
    expect(formatClock(24)).toBe('00:00')
  })
})
