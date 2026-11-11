// The email and the booking link (docs/brief.md, Contact and Upwork mode).
// Upwork bans contact details on pages it links to, and a static page can't
// know the mode on the server. So these two fields are in no page, no page
// data and no JavaScript file. modules/contact-details.ts writes them into one
// small file, and ContactBlock downloads it only after the browser has found
// that the visit is not in Upwork mode.
import type { Profile } from '../../shared/content/schemas'

export interface ContactDetails {
  email: string
  booking: { url: string, label: string }
}

// Where the built site serves the file.
export const contactDetailsPath = '/contact-details.json'

// Only these fields go into the file. Every field is named on purpose: never
// spread the profile.
export function pickContactDetails(profile: Profile): ContactDetails {
  return {
    email: profile.email,
    booking: { url: profile.booking.url, label: profile.booking.label },
  }
}

const isText = (value: unknown): value is string => typeof value === 'string' && value.length > 0

export function isContactDetails(value: unknown): value is ContactDetails {
  if (typeof value !== 'object' || value === null) return false
  const { email, booking } = value as Record<string, unknown>
  if (!isText(email) || typeof booking !== 'object' || booking === null) return false
  const { url, label } = booking as Record<string, unknown>
  return isText(url) && isText(label)
}

// Downloads the file. Gives undefined when it is missing, broken or the
// network fails, so the contact block keeps its Upwork fallback.
export async function loadContactDetails(fetcher: typeof fetch = globalThis.fetch): Promise<ContactDetails | undefined> {
  try {
    const response = await fetcher(contactDetailsPath, { headers: { accept: 'application/json' } })
    if (!response.ok) return undefined
    const data: unknown = await response.json()
    return isContactDetails(data) ? data : undefined
  }
  catch {
    return undefined
  }
}
