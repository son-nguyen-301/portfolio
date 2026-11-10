---
scope: "What may appear on the public portfolio site: employer names, client names, numbers, case study facts and which projects are shown."
not: "Design tokens, layout, Nuxt code structure or AWS/Terraform infra choices."
anchors:
  - "Never name the current employer; publish only sourced, manager-approved numbers"
triggers:
  paths:
    - "app/content/**"
    - "app/app/pages/**"
    - "app/app/components/**"
  keywords:
    - "case study"
    - "portfolio content"
    - "employer"
---

## Never name the current employer; publish only sourced, manager-approved numbers
class: directive

On the public site the current employer is "a New Zealand e-commerce company". Never publish its name, domain or link, coworker names, PR numbers, commit hashes or ticket IDs. Use only numbers that have a source and were approved by Son's manager (the private facts doc tags them [SAFE] / [SAFE ✓mgr]); drop anything tagged [KEEP OFF] or without a source. Leave out any project Son chose to exclude.

**Why:** Son decided this on 2026-11-10 with his manager. Breaking it could hurt his job, and this portfolio repo is public, so private facts must never be committed here either.

---

## What is Son's career timeline?
type: qa
answer: XTEL Apr 2019 – Jul 2021 (Team Lead, Frontend Developer). Outcubator / Paymentwall Jul 2021 – May 2022 (Frontend Developer). Aspire FT Pte Ltd May 2022 – Jul 2026 (Senior Frontend Developer, Singapore, remote). Current employer (NZ e-commerce, never named on the site) since Sep 2024, Senior Frontend Developer: a contractor while still at Aspire, full-time since Aspire ended in Jul 2026. Education: BachKhoa-Aptech, IT, 2015 – 2018. 7+ years with Vue.
captured: 2026-11-10
status: active
freshness: 365d

**Why:** From Son's CV and his answer on 2026-11-10. The CV PDF still says Aspire is current, so this entry wins over the PDF.

---

## What may the site say about Aspire?
type: qa
answer: Aspire may be named. Two case studies (multi-currency budgets and cards; cards and budgets redesign) plus a short "also built" list. No Aspire screenshots exist, so use diagrams. No numbers are known for Aspire work. Team feedback (reliable code, no P0 bugs, on time) is verbal only; quote it only after a former manager writes it, for example in a LinkedIn recommendation.
captured: 2026-11-10
status: active
freshness: 365d

**Why:** Son's answers on 2026-11-10, plus the rule that only sourced claims are published.

---

## What may the site say about Paymentwall?
type: qa
answer: Name it "Paymentwall" (Outcubator is only its Vietnamese legal name; don't use it). One case study: the Terminal3 website (a paywall for games), built from scratch in Vue 2 + Composition API + TypeScript with a Strapi content model Son designed; first version in 2 months; team of 1 PM, 1 backend, 2 frontend. Site is offline. No other numbers.
captured: 2026-11-10
status: active
freshness: 365d

**Why:** Son's answers on 2026-11-10.

---
