// @vitest-environment happy-dom
// The analytics hooks (app/utils/analytics.ts, D-025).
import { describe, expect, it, vi } from 'vitest'
import { beaconScript, beaconUrl, isTrackedEvent, trackEvent, trackedEventOf, trackedEvents } from '../../app/utils/analytics'

describe('beaconScript', () => {
  it('adds no beacon while the token is empty', () => {
    expect(beaconScript('')).toBeUndefined()
    expect(beaconScript('   ')).toBeUndefined()
    expect(beaconScript(undefined)).toBeUndefined()
  })

  it('adds the beacon with the token when one is set', () => {
    expect(beaconScript(' abc123 ')).toEqual({ 'src': beaconUrl, 'defer': true, 'data-cf-beacon': '{"token":"abc123"}' })
  })

  it('writes a token with quotes as JSON, not as markup', () => {
    expect(JSON.parse(beaconScript('a"b')!['data-cf-beacon'])).toEqual({ token: 'a"b' })
  })
})

describe('trackEvent', () => {
  it('sends the event to zaraz.track when it is on the page', () => {
    const track = vi.fn()
    expect(trackEvent('book-call', { zaraz: { track } })).toBe(true)
    expect(track).toHaveBeenCalledWith('book-call')
  })

  it('sends nothing, and does not throw, when no tool takes events', () => {
    expect(trackEvent('copy-email', {})).toBe(false)
    expect(trackEvent('copy-email', undefined)).toBe(false)
    expect(trackEvent('copy-email', { zaraz: {} })).toBe(false)
  })

  it('never lets a failing tool break the button', () => {
    const track = () => {
      throw new Error('blocked')
    }
    expect(trackEvent('message-upwork', { zaraz: { track } })).toBe(false)
  })
})

describe('trackedEventOf', () => {
  it('finds the event of the nearest data-track element', () => {
    document.body.innerHTML = '<a data-track="message-upwork" href="#"><span id="inner">Message me on Upwork</span></a>'
    expect(trackedEventOf(document.getElementById('inner'))).toBe('message-upwork')
  })

  it('ignores names the site does not count, and clicks outside', () => {
    document.body.innerHTML = '<button data-track="other">x</button><p id="p">y</p>'
    expect(trackedEventOf(document.querySelector('button'))).toBeUndefined()
    expect(trackedEventOf(document.getElementById('p'))).toBeUndefined()
    expect(trackedEventOf(null)).toBeUndefined()
  })

  it('knows the three clicks from docs/architecture.md', () => {
    expect([...trackedEvents]).toEqual(['book-call', 'copy-email', 'message-upwork'])
    expect(isTrackedEvent('book-call')).toBe(true)
    expect(isTrackedEvent(3)).toBe(false)
  })
})
