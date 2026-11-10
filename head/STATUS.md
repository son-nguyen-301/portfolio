# Task status

The runner updates this file in the PR it merges. GitHub Issues win when they differ.

## Sprints

| Sprint | Milestone | Runner tasks | Manual tasks | Status |
| --- | --- | --- | --- | --- |
| Sprint 1 - Foundation | #1 | PF-001 to PF-006 | PF-028, PF-032, PF-033, PF-034 | In progress (5 of 6 runner tasks done) |
| Sprint 2 - Trust and home | #2 | PF-007 to PF-011 | | Not started |
| Sprint 3 - Proof pages | #3 | PF-012 to PF-016 | PF-029, PF-030 | Not started |
| Sprint 4 - Remaining pages and sharing | #4 | PF-017 to PF-021 | | Not started |
| Sprint 5 - Quality and launch | #5 | PF-022, PF-023, PF-024, PF-031 | PF-025, PF-026, PF-027 | Not started |

## Tasks

| ID | Issue | Status | PR | Notes |
| --- | --- | --- | --- | --- |
| PF-001 | #27 | Done 2026-11-10 | #62 | Static Nuxt setup, modules, site config, lint and typecheck. 2 review rounds. |
| PF-002 | #28 | Done 2026-11-10 | #64 | Vitest, Playwright, the banned-words guard and CI. 3 review rounds. |
| PF-003 | #29 | Done 2026-11-10 | #68 | Zod schemas for the 7 collections, a build check that stops `pnpm generate` on a broken file, composables, and a test that no built page holds the email or booking link. 2 review rounds. |
| PF-004 | #30 | Done 2026-11-10 | #69 | Color tokens, type, base styles, self-hosted fonts, the theme switch with a no-flash head script, and a dev-only `/_gallery`. 3 review rounds. |
| PF-005 | #31 | Done 2026-11-10 | #70 | AppButton, MetricTile, TagList, QuoteBlock, ProofStrip, WorkCard and Timeline in the gallery, with component tests and a test that blocks hard-coded colors. 3 review rounds. |

## Live checks Son still owes

- PF-001: none.
- PF-002: make "CI / check" a required status check on `main` (#65).
- PF-003: none.
- PF-004: open the site on a real phone in light and dark; check the fonts load and the switch works.
- PF-005: open `/_gallery` in `pnpm dev` and look at the components in light and dark.

## Close pending

## Log

- 2026-11-10: Board created (7 epics, 17 stories, 34 tasks, 5 sprints) and the runner set up.
- 2026-11-10: PF-001 merged (#62). Findings noted on #34 (content dump holds contact details), #47 (OG fonts) and #49 (Node version for Workers Builds, service worker headers).
- 2026-11-10: PF-002 merged (#64). Opened #65 (P2, asks Son to make CI required), #66 (P3, guard: words split by markup) and #67 (P3, asks Son about D-004). Noted the PDF gap on #44.
- 2026-11-10: PF-003 merged (#68). Round 1 found the home page payload held the whole profile, email included; fixed with `useProfile(...fields)` and a browser test. Noted on #34 (dumps are now one per collection, widen the contact test), #38 (select card fields on /work) and #66 (guard can't read the compressed dumps).
- 2026-11-10: PF-004 merged (#69). Added `--on-jade` (dark `--ink` on jade is only 1.8:1). OG images are off in `nuxt dev` because `nuxt-og-image` hangs dev pages once the site fonts are used. Notes for #49 (CSP hash for the theme head script) and #47 (OG images off in dev) are in PR #69; posting them on those issues was refused in this run. 3 review rounds. Left as is: `.label` is 0.72rem but `--text-label` is 0.75rem, because `docs/design.md` gives both. For PF-006: the switch presses no button until mount and does nothing without JavaScript.
- 2026-11-10: PF-005 merged (#70). Component tests use Vitest with Vue Test Utils and happy-dom. The color test now also checks SVG color attributes, for the diagrams in PF-014. The design mockup `docs/design/Components.dc.html` is only in open PR #63; I matched its small details. Noted on #37 ("Fintech, e-commerce" breaks at the hyphen in the proof strip), #38 (case study summaries are 2 to 3 sentences, the card wants one line) #44 (Timeline shows jobs only, the CV needs education) and #32 (button states in the gallery). Opened #71 (P3, color test gaps in script code, `.ts` files and unquoted attributes).
