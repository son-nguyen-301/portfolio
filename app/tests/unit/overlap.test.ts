// Words and bar parts for the time overlap clock (app/utils/overlap.ts).
import { describe, expect, it } from 'vitest'
import { useTimeOverlap } from '../../app/composables/useTimeOverlap'
import {
  barParts,
  clockAt,
  describeOverlap,
  hourAt,
  hoursText,
  noOverlapSentence,
  offsetText,
  shortOverlapText,
  visitorOffsetAt,
  workHoursText,
  zoneCity,
} from '../../app/utils/overlap'

// Son's hours from app/content/profile.yml: 08:00 to 22:00 at UTC+7.
const describeAt = (offset: number) => describeOverlap(useTimeOverlap(offset, 8, 22, 7), offset, 7)

describe('describeOverlap', () => {
  it('UTC+0: 6 shared hours, 09:00 to 15:00', () => {
    expect(describeAt(0)).toEqual({ kind: 'shared', hours: 6, ranges: '09:00 to 15:00' })
  })

  it('UTC-5: 1 shared hour, 09:00 to 10:00', () => {
    expect(describeAt(-5)).toEqual({ kind: 'shared', hours: 1, ranges: '09:00 to 10:00' })
  })

  it('UTC-8: no overlap, calls at 06:00, the start of Son\'s last hour', () => {
    expect(describeAt(-8)).toEqual({ kind: 'none', callAt: '06:00' })
  })

  it('UTC-7: no overlap, calls at 07:00', () => {
    expect(describeAt(-7)).toEqual({ kind: 'none', callAt: '07:00' })
  })

  it('UTC+7: the same time zone', () => {
    expect(describeAt(7)).toEqual({ kind: 'same' })
  })

  it('UTC-3:30: a half-hour window', () => {
    expect(describeAt(-3.5)).toEqual({ kind: 'shared', hours: 2.5, ranges: '09:00 to 11:30' })
  })

  it('joins two windows with "and"', () => {
    // Son works 20:00 to 12:00 and the visitor 06:00 to 23:00, both in UTC.
    const overlap = useTimeOverlap(0, 20, 12, 0, 6, 23)
    expect(describeOverlap(overlap, 1, 0)).toEqual({ kind: 'shared', hours: 9, ranges: '06:00 to 12:00 and 20:00 to 23:00' })
  })
})

describe('the words', () => {
  it('writes work hours, with "hour" only for exactly 1', () => {
    expect(workHoursText(6)).toBe('6 work hours')
    expect(workHoursText(1)).toBe('1 work hour')
    expect(workHoursText(2.5)).toBe('2.5 work hours')
    expect(workHoursText(0.75)).toBe('0.75 work hours')
  })

  it('writes hours with no trailing zeros', () => {
    expect(hoursText(6)).toBe('6')
    expect(hoursText(2.25)).toBe('2.25')
    expect(hoursText(1 / 3)).toBe('0.33')
  })

  it('writes UTC offsets', () => {
    expect(offsetText(7)).toBe('UTC+7')
    expect(offsetText(0)).toBe('UTC+0')
    expect(offsetText(-5)).toBe('UTC-5')
    expect(offsetText(5.5)).toBe('UTC+5:30')
    expect(offsetText(5.75)).toBe('UTC+5:45')
    expect(offsetText(-3.5)).toBe('UTC-3:30')
  })

  it('writes the one-line phone text', () => {
    expect(shortOverlapText({ kind: 'shared', hours: 6, ranges: '09:00 to 15:00' })).toBe('6 h · 09:00 to 15:00')
    expect(shortOverlapText({ kind: 'shared', hours: 9, ranges: '06:00 to 12:00 and 20:00 to 23:00' })).toBe('9 h')
    expect(shortOverlapText({ kind: 'none', callAt: '06:00' })).toBe('0 h · calls at 06:00')
    expect(shortOverlapText({ kind: 'same' })).toBe('Same time zone')
  })

  it('turns a zone name into a city', () => {
    expect(zoneCity('Europe/London')).toBe('London')
    expect(zoneCity('America/New_York')).toBe('New York')
    expect(zoneCity('America/Argentina/Buenos_Aires')).toBe('Buenos Aires')
    expect(zoneCity('UTC')).toBe('UTC')
    expect(zoneCity('Asia/Ho_Chi_Minh')).toBe('Ho Chi Minh')
    expect(zoneCity(undefined)).toBe('')
    expect(zoneCity('')).toBe('')
  })

  it('uses the names cities use now, not the old names in some zone IDs', () => {
    expect(zoneCity('Asia/Calcutta')).toBe('Kolkata')
    expect(zoneCity('Europe/Kiev')).toBe('Kyiv')
    expect(zoneCity('Asia/Saigon')).toBe('Ho Chi Minh')
    expect(zoneCity('Asia/Katmandu')).toBe('Kathmandu')
    expect(zoneCity('Asia/Rangoon')).toBe('Yangon')
    expect(zoneCity('America/Godthab')).toBe('Nuuk')
    expect(zoneCity('Asia/Ulan_Bator')).toBe('Ulaanbaatar')
    expect(zoneCity('Asia/Kolkata')).toBe('Kolkata')
  })

  it('writes the no-overlap sentence', () => {
    expect(noOverlapSentence('06:00')).toBe('Our work days don\'t overlap. I send a written update before your day starts, and I can take calls at 06:00 your time.')
  })
})

describe('clock times', () => {
  const now = new Date('2026-01-14T12:00:40Z')

  it('gives the time at an offset from the UTC time', () => {
    expect(clockAt(now, 7)).toBe('19:00')
    expect(clockAt(now, 0)).toBe('12:00')
    expect(clockAt(now, -8)).toBe('04:00')
    expect(clockAt(now, 14)).toBe('02:00')
    expect(clockAt(now, 5.75)).toBe('17:45')
  })

  it('gives the hour for the "now" mark', () => {
    expect(hourAt(now, 0)).toBe(12)
    expect(hourAt(now, -12.5)).toBe(23.5)
  })

  it('flips the sign of getTimezoneOffset()', () => {
    // New York in winter: getTimezoneOffset() is 300 (minutes west of UTC).
    expect(visitorOffsetAt({ getTimezoneOffset: () => 300 } as Date)).toBe(-5)
    expect(visitorOffsetAt({ getTimezoneOffset: () => -330 } as Date)).toBe(5.5)
  })
})

describe('barParts', () => {
  it('draws a window inside one day as one part', () => {
    expect(barParts({ start: 9, end: 17, hours: 8 })).toEqual([{ left: 37.5, width: 33.33 }])
    expect(barParts({ start: 1, end: 15, hours: 14 })).toEqual([{ left: 4.17, width: 58.33 }])
  })

  it('draws a window that crosses midnight as two parts', () => {
    expect(barParts({ start: 17, end: 7, hours: 14 })).toEqual([
      { left: 70.83, width: 29.17 },
      { left: 0, width: 29.17 },
    ])
  })

  it('draws a window that ends at midnight as one part', () => {
    expect(barParts({ start: 10, end: 0, hours: 14 })).toEqual([{ left: 41.67, width: 58.33 }])
  })

  it('draws a full day and nothing', () => {
    expect(barParts({ start: 0, end: 0, hours: 24 })).toEqual([{ left: 0, width: 100 }])
    expect(barParts({ start: 5, end: 5, hours: 0 })).toEqual([])
  })
})
