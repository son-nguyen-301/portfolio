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
| 1 | 2 | P2 | PF-039 | #73 | none | loop | Found in PR #72. Son moved it to Sprint 2 and chose option 2. Fix before PF-016 and PF-018 use `Timeline` |
| 2 | 3 | P1 | PF-012 | #38 | #32, #31, #29 | head | Work list first in Sprint 3 |
| 3 | 3 | P1 | PF-013 | #39 | #38, #34 | head | Case study pages are the main proof |
| 4 | 3 | P1 | PF-015 | #41 | #34, #38 | head | Services links to case studies |
| 5 | 3 | P2 | PF-014 | #40 | #39 | head | Diagrams fill the case study media slots |
| 6 | 3 | P2 | PF-016 | #42 | #31, #29 | head | About page |
| 7 | 4 | P1 | PF-018 | #44 | #42, #33 | head | CV page for recruiters |
| 8 | 4 | P2 | PF-017 | #43 | #40 | head | P2, moved above P1 PF-020 because SEO covers every page |
| 9 | 4 | P2 | PF-019 | #45 | #34, #36 | head | P2, moved above P1 PF-020 because SEO covers every page |
| 10 | 4 | P1 | PF-020 | #46 | #39, #41, #42, #43, #44, #45 | head | SEO once every page exists |
| 11 | 4 | P2 | PF-021 | #47 | #46 | head | Preview images build on the SEO tags |
| 12 | 5 | P1 | PF-022 | #48 | #47 | head | Quality pass on the finished pages |
| 13 | 5 | P2 | PF-024 | #50 | #48, #49 | head | Launch prep after quality and hosting |
| 14 | 5 | P2 | PF-031 | #51 | #55, #56, #57, #40, #43 | head | Waits on Son's manual tasks PF-028, PF-029 and PF-030 |
| 15 | 5 | P3 | PF-036 | #66 | #28 | loop | Found in PR #64. Son moved it to Sprint 5. Guard polish |
| 16 | 5 | P3 | PF-037 | #67 | #28 | loop | Found in PR #64. Son moved it to Sprint 5. Asks Son about D-004 |
| 17 | 5 | P3 | PF-038 | #71 | #31 | loop | Found in PR #70. Son moved it to Sprint 5. Color test gaps |
| 18 | Backlog | P2 | PF-040 | #76 | #33 | loop | Found in PR #75. Asks Son about Upwork mode with JavaScript off. |
| 19 | Backlog | P2 | PF-041 | #78 | none | loop | Found in PR #77. Flaky keyboard test for the phone menu |
| 20 | Backlog | P2 | PF-043 | #83 | none | loop | Found in PR #82. Fixed bottom bar on phones, named in `docs/design.md` |
| 21 | Backlog | P2 | PF-044 | #84 | #49 | loop | Found in PR #85. Asks Son which tool counts button clicks |
| 22 | Backlog | P2 | PF-045 | #86 | #49 | loop | Found in PR #85. Asks Son to name the new header files as guard paths in `head/LOOP.md` |
| 23 | Backlog | P2 | PF-046 | #88 | #65 | loop | Found in PR #87. Asks Son how to protect the CI gate from a PR that changes it |
| 24 | Backlog | P2 | PF-047 | #89 | #65 | loop | Found in PR #87. The runner may merge on a skipped CI check left from a draft |
| 25 | Backlog | P2 | PF-048 | #90 | #28 | loop | Found in PR #87. The guard skips the names of broken symlinks |
| 26 | Backlog | P3 | PF-042 | #81 | none | loop | Found in PR #80. Four more renamed zones for the clock label |
