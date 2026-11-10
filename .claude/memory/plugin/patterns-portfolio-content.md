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
