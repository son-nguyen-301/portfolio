---
title: "Moving a live fintech area to a new design, with dark mode"
summary: "I moved the whole cards and budgets area to Aspire's new design system and added a dark theme, behind a feature flag so customers never saw a half-done screen."
client: "Aspire, a Singapore fintech"
role: "Senior Frontend Developer, the only frontend developer on the cards and budgets area"
team: "2 backend developers, 2 mobile developers, product managers and QA"
stack: [Vue 3, Quasar, Vite, Pinia, Playwright]
period: "Q1 to Q2 2026"
order: 5
featured: false
status: draft
cardMetric: "Light and dark, behind a flag"
metrics: []
quote: null
media:
  - type: diagram
    src: DiagramFeatureFlag
    alt: "Old and new screens side by side, with the new design turned on only for chosen businesses"
---

## The problem

Aspire moved its whole app to a new, more modern and consistent design. It also added a dark theme. Until then the app had only a light theme.

The cards and budgets area had to move to the new design without breaking a live product that handles money.

## What I did

1. **Moved every cards and budgets screen to the new component library** that Aspire built for the new design, replacing the old components.
2. **Made every screen work in light and dark themes.**
3. **Shipped behind a feature flag.** The new design was turned on first only for chosen businesses, such as our own test business. Real customers kept the old screens until the new ones were ready.

> **Hard choice:** release behind a flag instead of switching everyone at once. Chosen businesses tested the new screens first, and other customers never saw a half-finished page.

## The result

The whole cards and budgets area runs on the new design, in light and dark themes.
