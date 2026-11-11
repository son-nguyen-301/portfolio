// The contact details file (app/utils/contact.ts, modules/contact-details.ts).
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it, vi } from 'vitest'
import { parse } from 'yaml'
import { profileSchema } from '../../shared/content/schemas'
import { contactDetailsPath, isContactDetails, loadContactDetails, pickContactDetails } from '../../app/utils/contact'

const file = fileURLToPath(new URL('../../content/profile.yml', import.meta.url))
const profile = profileSchema.parse(parse(readFileSync(file, 'utf8')))

const sample = { email: 'sample@example.com', booking: { url: 'https://example.com/book', label: 'Book a sample call' } }

function answer(body: unknown, status = 200) {
  return vi.fn<typeof fetch>(async () => new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }))
}

describe('pickContactDetails', () => {
  it('takes only the email and the booking link', () => {
    const picked = pickContactDetails(profile)
    expect(Object.keys(picked).sort()).toEqual(['booking', 'email'])
    expect(Object.keys(picked.booking).sort()).toEqual(['label', 'url'])
    expect(picked).toEqual({ email: profile.email, booking: profile.booking })
  })
})

describe('isContactDetails', () => {
  it('accepts the file shape', () => {
    expect(isContactDetails(sample)).toBe(true)
  })

  it.each([
    ['null', null],
    ['a string', 'sample@example.com'],
    ['no email', { booking: sample.booking }],
    ['an empty email', { ...sample, email: '' }],
    ['no booking', { email: sample.email }],
    ['a booking with no url', { ...sample, booking: { label: 'Book' } }],
    ['a booking with a number label', { ...sample, booking: { url: sample.booking.url, label: 3 } }],
  ])('rejects %s', (_name, value) => {
    expect(isContactDetails(value)).toBe(false)
  })
})

describe('loadContactDetails', () => {
  it('downloads the file from its path', async () => {
    const fetcher = answer(sample)
    await expect(loadContactDetails(fetcher)).resolves.toEqual(sample)
    expect(fetcher).toHaveBeenCalledOnce()
    expect(fetcher.mock.calls[0]![0]).toBe(contactDetailsPath)
  })

  it('gives nothing when the file is missing', async () => {
    await expect(loadContactDetails(answer('Not found', 404))).resolves.toBeUndefined()
  })

  it('gives nothing when the file is not JSON', async () => {
    await expect(loadContactDetails(answer('<!doctype html><p>Page</p>'))).resolves.toBeUndefined()
  })

  it('gives nothing when the file has the wrong shape', async () => {
    await expect(loadContactDetails(answer({ email: 'sample@example.com' }))).resolves.toBeUndefined()
  })

  it('gives nothing when the network fails', async () => {
    const fetcher = vi.fn<typeof fetch>(async () => {
      throw new TypeError('Failed to fetch')
    })
    await expect(loadContactDetails(fetcher)).resolves.toBeUndefined()
  })
})
