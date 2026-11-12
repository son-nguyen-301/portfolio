// Words and shapes for the time overlap clock (docs/design.md, Time overlap
// clock). useTimeOverlap() does the math; these turn its result into the
// sentence, the one-line phone text and the parts of the 24-hour bar.
//
// Pure functions. They import by relative paths only, so a component test can
// load them (D-018).
import { formatClock } from '../composables/useTimeOverlap'
import type { TimeOverlap, TimeWindow } from '../composables/useTimeOverlap'

const day = 24 * 60

// A UTC offset in hours as "UTC+7", "UTC-5" or "UTC+5:30".
export function offsetText(offset: number): string {
  const minutes = Math.round(Math.abs(offset) * 60)
  const sign = offset < 0 ? '-' : '+'
  const hh = Math.floor(minutes / 60)
  const mm = minutes % 60
  return `UTC${sign}${hh}${mm ? `:${String(mm).padStart(2, '0')}` : ''}`
}

// A number of hours with no trailing zeros: 6, 2.5, 2.75.
export function hoursText(hours: number): string {
  return String(Math.round(hours * 100) / 100)
}

// The clock time at a UTC offset, as "HH:MM". Works from the UTC time, so it
// gives the same answer whatever zone the browser is in.
export function clockAt(now: Date, offset: number): string {
  return formatClock(hourAt(now, offset))
}

// The clock hour at a UTC offset, as a number from 0 up to 24, for the "now"
// mark on the bar.
export function hourAt(now: Date, offset: number): number {
  const minutes = now.getUTCHours() * 60 + now.getUTCMinutes() + Math.round(offset * 60)
  return (((minutes % day) + day) % day) / 60
}

// The visitor's UTC offset in hours, east positive.
// getTimezoneOffset() gives minutes west of UTC, so the sign flips.
export function visitorOffsetAt(now: Date): number {
  return -now.getTimezoneOffset() / 60
}

// Old city names that browsers still give back in zone IDs (Chrome gives
// "Asia/Calcutta" for Asia/Kolkata), and the names the cities use now.
const renamedCities: Record<string, string> = {
  Asmera: 'Asmara',
  Calcutta: 'Kolkata',
  Chungking: 'Chongqing',
  Dacca: 'Dhaka',
  Faeroe: 'Faroe',
  Godthab: 'Nuuk',
  Katmandu: 'Kathmandu',
  Kiev: 'Kyiv',
  Rangoon: 'Yangon',
  Saigon: 'Ho Chi Minh',
  Thimbu: 'Thimphu',
  Ujung_Pandang: 'Makassar',
  Ulan_Bator: 'Ulaanbaatar',
}

// Son's city for the clock, from profile.location: "Hanoi, Vietnam" -> "Hanoi".
export function locationCity(location: string): string {
  return location.split(',')[0]?.trim() ?? ''
}

// A city name from an IANA zone: "America/New_York" -> "New York",
// "Asia/Calcutta" -> "Kolkata". Empty when the browser gives no zone.
export function zoneCity(zone: string | undefined): string {
  if (!zone) return ''
  const last = zone.split('/').pop() ?? ''
  return (renamedCities[last] ?? last).replace(/_/g, ' ')
}

// What the clock says about the overlap.
// - same: the visitor is at Son's UTC offset.
// - shared: some hours overlap; `ranges` is "09:00 to 15:00" (two ranges are
//   joined with "and").
// - none: no overlap; `callAt` is the start of Son's last working hour, the
//   latest time before the visitor's day starts that Son can take a call.
export type OverlapText
  = | { kind: 'same' }
    | { kind: 'shared', hours: number, ranges: string }
    | { kind: 'none', callAt: string }

export function describeOverlap(overlap: TimeOverlap, visitorOffset: number, sonOffset: number): OverlapText {
  if (Math.round(visitorOffset * 60) === Math.round(sonOffset * 60)) return { kind: 'same' }
  if (overlap.hours > 0) {
    const ranges = overlap.windows.map(w => `${formatClock(w.start)} to ${formatClock(w.end)}`).join(' and ')
    return { kind: 'shared', hours: overlap.hours, ranges }
  }
  const lastHour = Math.min(1, overlap.son.hours)
  return { kind: 'none', callAt: formatClock(overlap.son.end - lastHour) }
}

// The sentence when the work days don't overlap. The clock also uses it with
// "00:00" as the longest sentence it can show, to reserve its height.
export function noOverlapSentence(callAt: string): string {
  return `Our work days don't overlap. I send a written update before your day starts, and I can take calls at ${callAt} your time.`
}

// "6 work hours", "1 work hour", "2.5 work hours".
export function workHoursText(hours: number): string {
  return `${hoursText(hours)} work ${hours === 1 ? 'hour' : 'hours'}`
}

// The one-line phone text after "Shared work hours", kept short enough for a
// 360 px screen: "6 h · 09:00 to 15:00", "0 h · calls at 06:00",
// "Same time zone".
export function shortOverlapText(text: OverlapText): string {
  if (text.kind === 'same') return 'Same time zone'
  if (text.kind === 'none') return `0 h · calls at ${text.callAt}`
  return text.ranges.includes(' and ') ? `${hoursText(text.hours)} h` : `${hoursText(text.hours)} h · ${text.ranges}`
}

// A part of the 24-hour bar, as percentages of its width.
export interface BarPart {
  left: number
  width: number
}

// The parts of the bar a window covers. A window that crosses midnight has two
// parts: from its start to the end of the bar, and from the start of the bar
// to its end.
export function barParts(window: TimeWindow): BarPart[] {
  const percent = (hours: number) => Math.round((hours / 24) * 100 * 100) / 100
  if (window.hours <= 0) return []
  if (window.hours >= 24) return [{ left: 0, width: 100 }]
  if (window.start + window.hours <= 24) return [{ left: percent(window.start), width: percent(window.hours) }]
  return [
    { left: percent(window.start), width: percent(24 - window.start) },
    { left: 0, width: percent(window.end) },
  ]
}
