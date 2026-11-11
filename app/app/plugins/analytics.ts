// Analytics (app/utils/analytics.ts, D-025): the Web Analytics beacon when a
// site token is set at build time, and one click listener for `data-track`.
import { beaconScript, trackEvent, trackedEventOf } from '../utils/analytics'

export default defineNuxtPlugin(() => {
  const beacon = beaconScript(useRuntimeConfig().public.cloudflareAnalyticsToken)
  if (beacon) useHead({ script: [beacon] })

  if (import.meta.client) {
    // Capture, so a click still counts when a button stops it from bubbling.
    document.addEventListener('click', (event) => {
      const name = trackedEventOf(event.target)
      if (name) trackEvent(name, window as Parameters<typeof trackEvent>[1])
    }, { capture: true })
  }
})
