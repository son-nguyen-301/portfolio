# Task queue

The order in which the runner picks work. Top first. GitHub Issues say what is open; this file says what goes first. A run edits this file only inside its own task PR. Son can edit it any time; a row with `Son` in "Added by" is never moved by a run.

## Priority

| Priority | Meaning |
| --- | --- |
| P0 | Breaks a hard rule, opens a security hole, loses data, or `main` fails a check. |
| P1 | A user loses input or state, or work stalls. |
| P2 | Slow paths, extra cost, a wrong message. |
| P3 | Cleanup, wording, small polish. |

## Rules for placing a row

1. Rows are grouped by sprint (the issue's milestone), in sprint order. `Backlog` rows (no milestone) go last. The runner only takes rows from the current sprint (`head/LOOP.md` section 4).
2. Inside a sprint, higher priority goes above lower priority.
3. A row goes below every row it needs. If that breaks rule 2, the needed row moves up and "Why here" says so.
4. Inside one priority, a new row goes at the end, unless a written reason puts it higher.
5. Never move a `Son` row.
6. A closed issue leaves the queue in the next run's PR.
7. `manual` tasks are never in the queue. A row can still need one on its `**Needs:**` line.

## Queue

| Pos | Sprint | Priority | ID | Issue | Needs | Added by | Why here |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | 1 | P2 | PF-005 | #31 | #30, #29 | head | P2, moved above P1 PF-006 because the layout needs these components |
| 2 | 1 | P1 | PF-006 | #32 | #31 | head | Header, footer and layout close Sprint 1 |
| 3 | 2 | P0 | PF-007 | #33 | #32, #29 | head | Upwork mode protects Son's account; first in Sprint 2 |
| 4 | 2 | P0 | PF-008 | #34 | #33 | head | Contact block must be Upwork-safe before any page shows contact details |
| 5 | 2 | P1 | PF-009 | #35 | #28 | head | Clock math before the clock |
| 6 | 2 | P1 | PF-010 | #36 | #35, #31 | head | Clock component for the home page |
| 7 | 2 | P1 | PF-011 | #37 | #34, #36 | head | Home page closes Sprint 2 |
| 8 | 3 | P1 | PF-012 | #38 | #32, #31, #29 | head | Work list first in Sprint 3 |
| 9 | 3 | P1 | PF-013 | #39 | #38, #34 | head | Case study pages are the main proof |
| 10 | 3 | P1 | PF-015 | #41 | #34, #38 | head | Services links to case studies |
| 11 | 3 | P2 | PF-014 | #40 | #39 | head | Diagrams fill the case study media slots |
| 12 | 3 | P2 | PF-016 | #42 | #31, #29 | head | About page |
| 13 | 4 | P1 | PF-018 | #44 | #42, #33 | head | CV page for recruiters |
| 14 | 4 | P2 | PF-017 | #43 | #40 | head | P2, moved above P1 PF-020 because SEO covers every page |
| 15 | 4 | P2 | PF-019 | #45 | #34, #36 | head | P2, moved above P1 PF-020 because SEO covers every page |
| 16 | 4 | P1 | PF-020 | #46 | #39, #41, #42, #43, #44, #45 | head | SEO once every page exists |
| 17 | 4 | P2 | PF-021 | #47 | #46 | head | Preview images build on the SEO tags |
| 18 | 5 | P1 | PF-022 | #48 | #47 | head | Quality pass on the finished pages |
| 19 | 5 | P1 | PF-023 | #49 | #45 | head | Cloudflare config before Son connects Workers Builds |
| 20 | 5 | P2 | PF-024 | #50 | #48, #49 | head | Launch prep after quality and hosting |
| 21 | 5 | P2 | PF-031 | #51 | #55, #56, #57, #40, #43 | head | Waits on Son's manual tasks PF-028, PF-029 and PF-030 |
| 22 | Backlog | P2 | PF-035 | #65 | #28 | loop | Found in PR #64. Asks Son to make CI required. |
| 23 | Backlog | P3 | PF-036 | #66 | #28 | loop | Found in PR #64. Guard polish. |
| 24 | Backlog | P3 | PF-037 | #67 | #28 | loop | Found in PR #64. Asks Son about D-004. |
