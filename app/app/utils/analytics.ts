// Analytics hooks (docs/architecture.md, Analytics; D-025).
//
// Page views: the Cloudflare Web Analytics beacon, only when a public site
// token is set at build time. With no token the pages hold no beacon.
//
// Clicks: buttons that matter carry `data-track="<event>"`. A click listener
// (plugins/analytics.ts) hands the name to trackEvent(). Web Analytics
// has no custom events, so trackEvent() sends them only when a tool that takes
// events is on the page (Cloudflare Zaraz, `zaraz.track()`). Until then a
// click sends nothing.

// Keep in step with beaconScriptOrigin in lib/headers.ts (the CSP allows it).
export const beaconUrl = 'https://static.cloudflareinsights.com/beacon.min.js'

// The clicks the site counts.
export const trackedEvents = ['book-call', 'copy-email', 'message-upwork'] as const
export type TrackedEvent = typeof trackedEvents[number]

export function isTrackedEvent(value: unknown): value is TrackedEvent {
  return typeof value === 'string' && (trackedEvents as readonly string[]).includes(value)
}

// The head script for the beacon, or nothing when the token is empty.
export function beaconScript(token: string | undefined) {
  const trimmed = token?.trim()
  if (!trimmed) return undefined
  return {
    'src': beaconUrl,
    'defer': true,
    'data-cf-beacon': JSON.stringify({ token: trimmed }),
  }
}

interface EventSink {
  zaraz?: { track?: (name: string) => unknown }
}

// Send one click event. Never throws: analytics must not break a button.
export function trackEvent(name: TrackedEvent, sink: EventSink | undefined): boolean {
  try {
    const track = sink?.zaraz?.track
    if (typeof track !== 'function') return false
    track.call(sink!.zaraz, name)
    return true
  }
  catch {
    return false
  }
}

// The event name of the nearest element with `data-track`, from a click target.
export function trackedEventOf(target: EventTarget | null): TrackedEvent | undefined {
  const element = target && 'closest' in target ? (target as Element).closest('[data-track]') : null
  const name = element?.getAttribute('data-track')
  return isTrackedEvent(name) ? name : undefined
}
