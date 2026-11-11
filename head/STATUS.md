# Task status

The runner updates this file in the PR it merges. GitHub Issues win when they differ.

## Sprints

| Sprint | Milestone | Runner tasks | Manual tasks | Status |
| --- | --- | --- | --- | --- |
| Sprint 1 - Foundation | #1 | PF-001 to PF-006 | PF-028, PF-032, PF-033, PF-034 | Done. Son reviewed it on 2026-11-11. |
| Sprint 2 - Trust and home | #2 | PF-007 to PF-011, PF-023, PF-035, PF-039 | PF-025 | In progress (3 of 8 runner tasks done) |
| Sprint 3 - Proof pages | #3 | PF-012 to PF-016 | PF-029, PF-030 | Not started |
| Sprint 4 - Remaining pages and sharing | #4 | PF-017 to PF-021 | | Not started |
| Sprint 5 - Quality and launch | #5 | PF-022, PF-024, PF-031, PF-036, PF-037, PF-038 | PF-026, PF-027 | Not started |

## Tasks

| ID | Issue | Status | PR | Notes |
| --- | --- | --- | --- | --- |
| PF-001 | #27 | Done 2026-11-10 | #62 | Static Nuxt setup, modules, site config, lint and typecheck. 2 review rounds. |
| PF-002 | #28 | Done 2026-11-10 | #64 | Vitest, Playwright, the banned-words guard and CI. 3 review rounds. |
| PF-003 | #29 | Done 2026-11-10 | #68 | Zod schemas for the 7 collections, a build check that stops `pnpm generate` on a broken file, composables, and a test that no built page holds the email or booking link. 2 review rounds. |
| PF-004 | #30 | Done 2026-11-10 | #69 | Color tokens, type, base styles, self-hosted fonts, the theme switch with a no-flash head script, and a dev-only `/_gallery`. 3 review rounds. |
| PF-005 | #31 | Done 2026-11-10 | #70 | AppButton, MetricTile, TagList, QuoteBlock, ProofStrip, WorkCard and Timeline in the gallery, with component tests and a test that blocks hard-coded colors. 3 review rounds. |
| PF-006 | #32 | Done 2026-11-10 | #72 | SiteHeader with a phone menu (a modal `<dialog>`), SiteFooter, skip link, 404 page in the layout, and placeholder pages for every link. The layout reads its profile fields from app config, so no page downloads the profile collection (D-019). 3 review rounds. |
| PF-007 | #33 | Done 2026-11-11 | #75 | Upwork mode: `?from=upwork` and session storage, a head script that marks `<html>` before paint, CSS classes for the header, phone menu and footer, and `useUpworkMode()` for the contact block (D-020). 2 review rounds. |
| PF-008 | #34 | Done 2026-11-11 | #77 | ContactBlock on the `/contact` placeholder. The built page holds only "Message me on Upwork". Outside Upwork mode, the email and the booking link come from `/contact-details.json` after mount. The build has no copy of the profile collection (D-021). 2 review rounds. |
| PF-009 | #35 | Done 2026-11-11 | #79 | `useTimeOverlap(visitorOffset, ...)` in `app/app/composables/useTimeOverlap.ts`: shared hours, the shared windows, Son's hours and the visitor's workday, all in the visitor's time, in whole minutes. `formatClock()` writes `HH:MM` (D-022). 1 review round. |

## Live checks Son still owes

- PF-001: none.
- PF-002: make "CI / check" a required status check on `main` (#65).
- PF-003: none.
- PF-004: open the site on a real phone in light and dark; check the fonts load and the switch works.
- PF-005: open `/_gallery` in `pnpm dev` and look at the components in light and dark.
- PF-006: open the site on a real phone, also inside the LinkedIn app: the menu opens, closes and scrolls nothing behind it, in light and dark. Check the header and footer against the mockups in light and dark.
- PF-007: on a real phone, open `/?from=upwork` (after PF-025), then another page: no Contact link, no call button and no LinkedIn link in the header, phone menu and footer, and "Message me on Upwork" instead, in light and dark. Open the same link from your Upwork profile.
- PF-008: on a real phone, open `/contact` in light and dark: the email shows, Copy email shows "Copied" and then goes back, and the booking button opens Cal.com. Open `/contact?from=upwork`: only "Message me on Upwork". After PF-023 and PF-025, `/__nuxt_content/profile/sql_dump.txt` and `/dump.profile.sql` on the live site are both 404.
- PF-009: none. PF-010 draws the clock.

## Close pending

## Log

- 2026-11-10: Board created (7 epics, 17 stories, 34 tasks, 5 sprints) and the runner set up.
- 2026-11-10: PF-001 merged (#62). Findings noted on #34 (content dump holds contact details), #47 (OG fonts) and #49 (Node version for Workers Builds, service worker headers).
- 2026-11-10: PF-002 merged (#64). Opened #65 (P2, asks Son to make CI required), #66 (P3, guard: words split by markup) and #67 (P3, asks Son about D-004). Noted the PDF gap on #44.
- 2026-11-10: PF-003 merged (#68). Round 1 found the home page payload held the whole profile, email included; fixed with `useProfile(...fields)` and a browser test. Noted on #34 (dumps are now one per collection, widen the contact test), #38 (select card fields on /work) and #66 (guard can't read the compressed dumps).
- 2026-11-10: PF-004 merged (#69). Added `--on-jade` (dark `--ink` on jade is only 1.8:1). OG images are off in `nuxt dev` because `nuxt-og-image` hangs dev pages once the site fonts are used. Notes for #49 (CSP hash for the theme head script) and #47 (OG images off in dev) are in PR #69; posting them on those issues was refused in this run. 3 review rounds. Left as is: `.label` is 0.72rem but `--text-label` is 0.75rem, because `docs/design.md` gives both. For PF-006: the switch presses no button until mount and does nothing without JavaScript.
- 2026-11-10: PF-005 merged (#70). Component tests use Vitest with Vue Test Utils and happy-dom. The color test now also checks SVG color attributes, for the diagrams in PF-014. The design mockup `docs/design/Components.dc.html` is only in open PR #63; I matched its small details. Noted on #37 ("Fintech, e-commerce" breaks at the hyphen in the proof strip), #38 (case study summaries are 2 to 3 sentences, the card wants one line) #44 (Timeline shows jobs only, the CV needs education) and #32 (button states in the gallery). Opened #71 (P3, color test gaps in script code, `.ts` files and unquoted attributes).
- 2026-11-10: PF-006 merged (#72). Round 1 found that `404.html`, which has no prerendered page data, ran the layout's profile query in the browser and downloaded the profile collection with the email and booking link. Fixed with build-time app config (D-019) and a browser test. Opened #73 (P2, Backlog, Ask Son): `Timeline` imports a value from `shared/` by a relative path (D-018), which fails `pnpm generate` once a page uses it; plan it before PF-016. Noted on #33 (Upwork mode also covers the footer and phone menu), #34 (a browser content query downloads the whole collection), #45 (`404.html` is blank without JavaScript, and logs NUXT_E1005) and #46 (placeholder pages are indexable). Sprint 1 runner tasks are done.
- 2026-11-11: Sprint 2 started after Son's Sprint 1 review. Queue rows moved to Son's new sprint plan (PF-023, PF-035 and PF-039 into Sprint 2; PF-036 to PF-038 into Sprint 5).
- 2026-11-11: PF-007 merged (#75). Both reviewers approved in rounds 1 and 2. Opened #76 (PF-040, P2, Backlog, Ask Son): with JavaScript off, `/?from=upwork` still shows LinkedIn and the Contact links. Noted on #49 that the CSP needs the hash of the second head script.
- 2026-11-11: PF-008 merged (#77). Both reviewers approved in rounds 1 and 2. In round 1, a `WORKERS_CI=1` build showed that the Cloudflare preset writes `dump.profile.sql`, so the scan now decodes every gzip-base64 file. Opened #78 (PF-041, P2, Backlog): a flaky keyboard test for the phone menu. Noted on #49: with `WORKERS_CI=1`, the build has no prerendered pages (no `nitro.preset` is set), which may be why Workers Builds fails on `main`. `/contact-details.json` needs `noindex` and a CSP `connect-src` entry. Noted on #37: reserve the contact block's height.
- 2026-11-11: PF-009 merged (#79). The reviewer approved in round 1, after checking the math against a minute-by-minute count over 200,000 random inputs. Noted on #36 (PF-010): pass `-getTimezoneOffset() / 60`, and the shared hours change with daylight saving (US East has 2 h in summer, Sydney 5 to 6 h, not what the `docs/brief.md` table says). #78 failed once more in this run.
