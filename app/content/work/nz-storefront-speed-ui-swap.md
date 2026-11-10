---
title: "Faster pages and a safe UI library swap on a live shop"
summary: "I cut the UI library CSS by 65% on a live online shop, then replaced the whole UI library with test coverage held at 93%."
client: "A New Zealand e-commerce company"
role: "Senior Frontend Developer"
team: "Dev team of 7, including vendor developers"
stack: [Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4, Nuxt UI, Playwright, Vitest, Docker, GitHub Actions]
period: "Speed work May to Aug 2026. UI library swap Sep 2026 (about 2 weeks)."
order: 1
featured: true
status: ready
cardMetric: "UI library CSS −65%"
metrics:
  - value: "−65%"
    label: "UI library CSS (419,729 → 145,215 bytes)"
  - value: "−37%"
    label: "Homepage HTML (816 KB → 510 KB)"
  - value: "93%"
    label: "Line coverage kept through the UI library swap"
  - value: "64 s → 38 s"
    label: "Typical Docker deploy"
quote: null
media:
  - type: image
    alt: "Room home page with the hero image"
    caption: "TODO: screenshot from staging, company name and prices blurred"
  - type: image
    alt: "UI kit gallery after the library swap"
    caption: "TODO: screenshot from staging"
---

## The problem

The shop sells bathroom, kitchen, laundry and wardrobe products to retail and trade customers. A first visit to the home page took 13.9 seconds to load, and the main content showed at 17.7 seconds.

Every page also carried about 421 KB of CSS from the UI library, mostly for parts the site never used.

Then the UI library moved to a paid licence for each developer in its next major version. We had to leave it without breaking a live shop.

## What I did

1. **Found why the main content was late.** The hero image had loaded at 2.3 seconds but stayed hidden until the slider's JavaScript ran. I made the first slide show straight from the server HTML.
2. **Stopped shipping CSS for unused parts.** I loaded only the 20 UI components we use. The library CSS went from 419,729 to 145,215 bytes.
3. **Cut what the browser waits for.** I removed stylesheets that blocked the page and were already inlined. I stopped sending other shops' header data, which cut the page data by 53%. On one page I removed 96 of 253 script requests by dropping unused prefetch hints and an unused icon font.
4. **Built a safety net before the big change.** I added end-to-end tests with a coverage gate in CI at 90% of lines. For the swap I also kept a temporary set of screenshot tests.
5. **Replaced the UI library in about 60 small pull requests.**

> **Hard choice:** a big-bang rewrite would have been faster to start. I first wrapped every old component behind our own component layer, then swapped them one at a time. Each step was small, easy to review and checked against screenshots. Where the new library had no match, I ported the old component, so the site looked the same.

The swap was not smooth everywhere. The new library turned 39 of 78 screenshot tests red, two libraries exported a function with the same name, and coverage dropped to 85.6%. I added 9 new test files (119 tests). They brought coverage back and found a keyboard bug in a menu.

## The result

- UI library CSS down 65%. Homepage HTML down 37%.
- The UI library was replaced with 766 end-to-end tests and 1,416 unit tests passing, and line coverage at 93%.
- Typical Docker deploys went from 64 to 38 seconds.
- The IT team leader called the released speed fix "way faster".
