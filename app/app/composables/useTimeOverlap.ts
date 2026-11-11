// Time overlap (docs/brief.md, Working hours). Which of Son's working hours
// fall inside a visitor's workday, shown in the visitor's own time. The home
// page clock (PF-010) draws it.
//
// Pure math: no Vue, no clock, no browser. The caller passes the visitor's UTC
// offset in hours (5.5 for UTC+5:30). All hours are clock hours from 0 to 24,
// and fractions are allowed (8.5 is 08:30). A window whose end is earlier than
// its start crosses midnight: 22 to 6 is 8 hours.
//
// It works in whole minutes, so half-hour and 45-minute zones add up exactly.

// A span of time on a 24-hour clock, in the visitor's time.
export interface TimeWindow {
  // Clock hour where it starts, 0 up to but not including 24.
  start: number
  // Clock hour where it ends, 0 up to but not including 24. When it is not
  // more than `start`, the window crosses midnight (or is a full day).
  end: number
  // Its length in hours, 0 to 24.
  hours: number
}

export interface TimeOverlap {
  // Shared hours in total.
  hours: number
  // The shared time, in the visitor's time, earliest start first. Empty when
  // there is none. Usually one window; two when both windows cross midnight
  // and meet on both sides of it.
  windows: TimeWindow[]
  // Son's working hours in the visitor's time.
  son: TimeWindow
  // The visitor's workday.
  visitor: TimeWindow
}

const day = 24 * 60

// Clock hours to whole minutes. Throws on a value that is not a number, so a
// typo fails loudly instead of showing NaN on the page.
function toMinutes(name: string, value: number, min: number, max: number): number {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${name} must be a number from ${min} to ${max}, got ${value}`)
  }
  return Math.round(value * 60)
}

function wrap(minutes: number): number {
  return ((minutes % day) + day) % day
}

// A window from start to end, in minutes. The same start and end means no time
// at all, except 0 to 24, which is the whole day.
function span(start: number, end: number): { start: number, length: number } {
  const length = end - start === day ? day : wrap(end - start)
  return { start: wrap(start), length }
}

function toWindow(start: number, length: number): TimeWindow {
  return { start: start / 60, end: wrap(start + length) / 60, hours: length / 60 }
}

// The parts of two windows on the 24-hour clock that overlap, as
// { start, length } in minutes. Each window is at most a day long, so laying
// the second one out on the day before, the same day and the day after
// covers every case.
function intersect(a: { start: number, length: number }, b: { start: number, length: number }) {
  const parts: { start: number, length: number }[] = []
  for (const shift of [-day, 0, day]) {
    const start = Math.max(a.start, b.start + shift)
    const end = Math.min(a.start + a.length, b.start + shift + b.length)
    if (end > start) parts.push({ start: wrap(start), length: end - start })
  }
  parts.sort((x, y) => x.start - y.start)

  // Join parts that touch, also across midnight, so one stretch of time is
  // one window.
  const joined: { start: number, length: number }[] = []
  for (const part of parts) {
    const last = joined[joined.length - 1]
    if (last && last.start + last.length === part.start) last.length += part.length
    else joined.push({ ...part })
  }
  if (joined.length > 1) {
    const first = joined[0]!
    const last = joined[joined.length - 1]!
    if (last.start + last.length === first.start + day) {
      last.length += first.length
      joined.shift()
    }
  }
  return joined
}

// visitorOffset: the visitor's UTC offset in hours, -12 to 14.
// sonStart, sonEnd, sonOffset: Son's working hours and Son's UTC offset
// (08:00 to 22:00 at UTC+7, docs/brief.md).
// visitorStart, visitorEnd: the visitor's workday (9 to 5).
export function useTimeOverlap(
  visitorOffset: number,
  sonStart = 8,
  sonEnd = 22,
  sonOffset = 7,
  visitorStart = 9,
  visitorEnd = 17,
): TimeOverlap {
  const shift = toMinutes('visitorOffset', visitorOffset, -12, 14) - toMinutes('sonOffset', sonOffset, -12, 14)

  // Son's hours moved into the visitor's time.
  const son = span(
    toMinutes('sonStart', sonStart, 0, 24) + shift,
    toMinutes('sonEnd', sonEnd, 0, 24) + shift,
  )
  const visitor = span(toMinutes('visitorStart', visitorStart, 0, 24), toMinutes('visitorEnd', visitorEnd, 0, 24))

  const shared = intersect(son, visitor)

  return {
    hours: shared.reduce((sum, part) => sum + part.length, 0) / 60,
    windows: shared.map(part => toWindow(part.start, part.length)),
    son: toWindow(son.start, son.length),
    visitor: toWindow(visitor.start, visitor.length),
  }
}

// A clock hour as "HH:MM", for example 9.5 -> "09:30". 24 is shown as 00:00.
export function formatClock(hour: number): string {
  const minutes = wrap(Math.round(hour * 60))
  const hh = String(Math.floor(minutes / 60)).padStart(2, '0')
  const mm = String(minutes % 60).padStart(2, '0')
  return `${hh}:${mm}`
}
