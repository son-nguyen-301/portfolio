# Decisions

One row per decision. Changing a decision is a new row that says which one it replaces. Product and design decisions live in `CLAUDE.md` and `docs/`; this file holds how the work is run and the conventions tasks add.

| # | Date | Decision | Why | Replaces |
| --- | --- | --- | --- | --- |
| D-001 | 2026-11-10 | The Portfolio task runner works through the queue as `head/LOOP.md` says. | Son asked for cloud runs that build, review and merge with no timer. | — |
| D-002 | 2026-11-10 | The work is a Scrum project on GitHub: epics hold stories, stories hold tasks (sub-issues), sprints are milestones, tasks are sized S, M or L. See `docs/scrum.md`. | Son asked for sprints, epics, stories and tasks on a GitHub board. | — |
| D-003 | 2026-11-10 | The runner only takes tasks from the current sprint, and stops after the last runner task of a sprint merges, with a sprint review comment. Son restarts it with `loop-go`. | A sprint review by the product owner is part of Scrum, and it catches problems before the next sprint builds on them. | — |
| D-004 | 2026-11-10 | The banned-words guard compares SHA-256 hashes of words, never the plain words. | The repo is public, so the list of names to block can't be written in it. | — |
| D-005 | 2026-11-10 | Task PRs are squash-merged. | One commit per task keeps `main` easy to read and to revert. | — |
