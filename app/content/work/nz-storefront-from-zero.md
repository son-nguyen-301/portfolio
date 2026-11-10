---
title: "Building a live storefront from zero, and leading the team on it"
summary: "I set up a new Nuxt storefront to replace an old site, led 3 vendor developers onto it, made one app serve 5 shops, and built the test system from nothing."
client: "A New Zealand e-commerce company"
role: "Senior Frontend Developer. Set up the project and led the frontend."
team: "Dev team of 7, including vendor developers"
stack: [Nuxt 4, Vue 3, TypeScript, Tailwind CSS 4, Playwright, Vitest, Docker, GitHub Actions]
period: "Sep 2024 to now"
order: 3
featured: true
status: ready
cardMetric: "53% of the commits, 235 reviews"
metrics:
  - value: "53%"
    label: "Of all commits in the repo are mine"
  - value: "379"
    label: "Pull requests merged, plus 235 reviewed for others"
  - value: "5 → 1"
    label: "Shops served by one app instead of one container each"
  - value: "90%"
    label: "Line coverage gate in CI, from no tests at all"
quote: null
media:
  - type: diagram
    src: DiagramRoomsByUrl
    alt: "One app reads the shop from the first part of the URL and picks its theme, header, footer and content"
---

## The problem

The company sold bathroom, kitchen, laundry and wardrobe products on an older site built with Django and some Vue 2. It needed a new storefront for retail, trade and wholesale customers, with prices that change by customer type.

Each of the five shops ran in its own container, with its own settings, port, deploy script and subdomain. Until June 2026, the only automatic check was lint.

## What I did

1. **Set up the new app in September 2024**, with Nuxt, Tailwind and form validation, and the first layout and form components. The new Nuxt app replaced the old site.
2. **Led 3 developers from an outside vendor team onto Nuxt 4 and Vue 3.** I reviewed 235 pull requests by other developers.
3. **Made one app serve all 5 shops.** The app reads the shop from the first part of the URL while it renders on the server, so the right theme, content and page tags are in the first HTML, with no flash of the wrong colors. I deleted the per-shop deploy scripts. A new shop is now two constants and a color file.
4. **Built the test system from nothing.** Vitest for shared code, Playwright for real user flows, and coverage collected from end-to-end tests, merged across 10 CI jobs and enforced as a gate.
5. **Kept the stack current:** Nuxt 3 to 4, Tailwind 3 to 4 (build time about 500–600 s → 300–400 s), yarn to pnpm, Node 20 to 22 to 24.
6. **Rebuilt the Favourites page without breaking it.** First I pinned the old behavior with 15 tests that describe what it already did. Then I moved the rules into small, tested functions and rebuilt the page. The old tests still passed, and switching lists now makes one product request.

> **Hard choice:** coverage from end-to-end tests, not from unit tests alone. Real user flows say more about whether a page works. Unit tests stay on code that many pages share.

## The result

- One container per environment instead of one per shop.
- The coverage gate rose from 78% to 90% of lines and 92% of statements, and held at 93% through the UI library swap.
- 175 work items done in production between Oct 2025 and Nov 2026.
- I wrote 53% of the repo's commits, merged 379 pull requests and reviewed 235.
