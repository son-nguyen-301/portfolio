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
| 1 | 5 | P2 | PF-031 | #51 | #55, #56, #57, #40, #43 | head | Waits on Son's manual tasks PF-028, PF-029 and PF-030 |
| 2 | 5 | P3 | PF-038 | #71 | #31 | loop | Found in PR #70. Son moved it to Sprint 5. Color test gaps |
| 3 | Backlog | P2 | PF-040 | #76 | #33 | loop | Found in PR #75. Asks Son about Upwork mode with JavaScript off. |
| 4 | Backlog | P2 | PF-041 | #78 | none | loop | Found in PR #77. Flaky keyboard test for the phone menu |
| 5 | Backlog | P2 | PF-043 | #83 | none | loop | Found in PR #82. Fixed bottom bar on phones, named in `docs/design.md` |
| 6 | Backlog | P2 | PF-044 | #84 | #49 | loop | Found in PR #85. Asks Son which tool counts button clicks |
| 7 | Backlog | P2 | PF-045 | #86 | #49 | loop | Found in PR #85. Asks Son to name the new header files as guard paths in `head/LOOP.md` |
| 8 | Backlog | P2 | PF-046 | #88 | #65 | loop | Found in PR #87. Asks Son how to protect the CI gate from a PR that changes it |
| 9 | Backlog | P2 | PF-047 | #89 | #65 | loop | Found in PR #87. The runner may merge on a skipped CI check left from a draft |
| 10 | Backlog | P2 | PF-048 | #90 | #28 | loop | Found in PR #87. The guard skips the names of broken symlinks |
| 11 | Backlog | P2 | PF-050 | #97 | none | loop | Found in PR #96. The page scrolls back to the top while it loads |
| 12 | Backlog | P2 | PF-056 | #115 | #50 | loop | Found in PR #114. A docs-only PR that edits `docs/open-items.md` skips the test that checks it |
| 13 | Backlog | P3 | PF-042 | #81 | none | loop | Found in PR #80. Four more renamed zones for the clock label |
| 14 | Backlog | P3 | PF-049 | #93 | none | loop | Found in PR #92. The import test misses the `~~/shared` and `@@/shared` aliases |
| 15 | Backlog | P3 | PF-051 | #100 | none | loop | Found in PR #99. `docs/design.md` names four service groups, the content has three |
| 16 | Backlog | P3 | PF-052 | #101 | none | loop | Found in PR #99. Step numbers run into the step text in the Markdown copies |
| 17 | Backlog | P3 | PF-053 | #103 | none | loop | Found in PR #102. The work cards show no image or diagram, though `docs/design.md` says they do |
| 18 | Backlog | P3 | PF-057 | #116 | #50 | loop | Found in PR #114. Six small gaps in the link checker and the TODO report |
| 19 | Backlog | P3 | PF-058 | #118 | #66 | loop | Found in PR #117. The guard does not join words around Unicode dashes |
