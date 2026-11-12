// The parts of a Lab card (PF-017, docs/design/Lab.dc.html) that are rules, not
// layout: how the media shows, the color of the status tag, and the link label.
// No imports from `shared/` (D-027), so a component test can load it.
import { isTodo, mediaView } from './case-study'
import type { MediaItem } from './case-study'

export interface LabMediaView {
  show: 'image' | 'diagram' | 'placeholder'
  // The words on a placeholder.
  label?: string
}

// The real image or diagram, or a neutral placeholder. A Lab item's `alt` text
// can still be a note for Son ("TODO: screenshot of ..."); such an item is not
// ready, and the note never shows. A card has no caption.
export function labMedia(item: MediaItem, hasDiagram: (name: string) => boolean): LabMediaView {
  const { show } = mediaView(item, hasDiagram)
  if (show !== 'placeholder' && !isTodo(item.alt)) return { show }
  return { show: 'placeholder', label: item.type === 'image' ? 'Screenshot coming' : 'Diagram coming' }
}

// A project still being built gets the amber tag, as Looper does in the
// design; every other status gets the jade one.
export function statusTone(status: string): 'live' | 'building' {
  return /\bin progress\b/i.test(status) ? 'building' : 'live'
}

// "See it on GitHub →" for a GitHub link, as in the design, else "See it →".
export function linkLabel(link: string): string {
  const host = new URL(link).hostname.replace(/^www\./, '')
  return host === 'github.com' ? 'See it on GitHub →' : 'See it →'
}
