# Task status

The runner updates this file in the PR it merges. GitHub Issues win when they differ.

## Sprints

| Sprint | Milestone | Runner tasks | Manual tasks | Status |
| --- | --- | --- | --- | --- |
| Sprint 1 - Foundation | #1 | PF-001 to PF-006 | PF-028, PF-032, PF-033, PF-034 | In progress (3 of 6 runner tasks done) |
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

## Live checks Son still owes

- PF-001: none.
- PF-002: make "CI / check" a required status check on `main` (#65).
- PF-003: none.

## Close pending

## Log

- 2026-11-10: Board created (7 epics, 17 stories, 34 tasks, 5 sprints) and the runner set up.
- 2026-11-10: PF-001 merged (#62). Findings noted on #34 (content dump holds contact details), #47 (OG fonts) and #49 (Node version for Workers Builds, service worker headers).
- 2026-11-10: PF-002 merged (#64). Opened #65 (P2, asks Son to make CI required), #66 (P3, guard: words split by markup) and #67 (P3, asks Son about D-004). Noted the PDF gap on #44.
- 2026-11-10: PF-003 merged (#68). Round 1 found the home page payload held the whole profile, email included; fixed with `useProfile(...fields)` and a browser test. Noted on #34 (dumps are now one per collection, widen the contact test), #38 (select card fields on /work) and #66 (guard can't read the compressed dumps).
