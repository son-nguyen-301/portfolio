# How the work is run (Scrum on GitHub)

The build is a small Scrum project. GitHub is the board. The Portfolio task runner (`head/LOOP.md`) does the building, one task per run. Son is the product owner: he plans sprints, answers questions, does the `manual` tasks and reviews each sprint.

## The hierarchy

| Level | GitHub | Title | Labels | Holds |
| --- | --- | --- | --- | --- |
| Epic | Issue | `Epic: <name>` | `epic` | Stories (sub-issues) |
| Story | Issue | `Story: <what a person can do>` | `story` | Tasks (sub-issues) |
| Task | Issue | `PF-0XX - <title>` | `task`, a size label, sometimes `manual` | One pull request |
| Sprint | Milestone | `Sprint N - <goal>` | | The tasks planned for it |

- A **story** is written from a person's side: a visitor, a client, a recruiter or Son. It says what they can do when the story is done.
- A **task** is one pull request that a runner can build, test and review in one run. Tasks carry the real work.
- A `manual` task is work only Son can do (accounts, dashboards, quotes, screenshots). The runner never builds, edits or closes it. A runner task can need a `manual` task; it then waits until Son closes it.
- Bugs and extra work the runner finds become tasks with `found-by-loop`.

## Task size

Every task fits in one run and one pull request: big enough to ship something you can see or test, small enough to review in one sitting.

| Label | Points | Meaning |
| --- | --- | --- |
| `size: S` | 2 | One part or one page, a few files. About 1 to 2 hours of agent work. |
| `size: M` | 3 | A feature with its tests, up to about 10 files. About half a day. |
| `size: L` | 5 | The largest allowed: a page family or a full setup. About a day. |

Anything bigger than L gets split into two tasks. Anything smaller than S gets folded into a neighbor task.

## Priority

Same scale as `head/QUEUE.md`: P0 breaks a hard rule or `main`; P1 blocks work or loses input; P2 slow, costly or wrong; P3 polish.

## Definition of Ready (a task the runner may pick)

- It has **Read first**, **What to do**, **Acceptance** and **Needs** sections.
- Every issue on its **Needs** line is closed.
- It has a sprint milestone and a size label.
- It does not need a fact that is missing from `app/content/`.

## Definition of Done (a task the runner may merge)

- Every acceptance item is met, or listed as a live check Son owes.
- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm generate` and `pnpm test:e2e` pass (`head/LOOP.md` section 9).
- New logic has unit tests. New pages have a Playwright smoke test.
- CLAUDE.md hard rules 1 to 7 hold. The banned-words guard passes.
- Pages work in light and dark, and at 360 px width with no sideways scroll.
- A fresh subagent approved the PR (and a second, security-only subagent for guard paths).
- `head/STATUS.md`, `head/QUEUE.md` and `head/DECISIONS.md` are updated in the same PR.

## Sprints and ceremonies

| Ceremony | Who | How |
| --- | --- | --- |
| Sprint planning | Son | Set the milestone on the issues for the next sprint. Order inside the sprint comes from `head/QUEUE.md`. |
| Daily work | Runner | One run per task, chained by the `loop-go` label. |
| Sprint review | Son | When the last runner task of a sprint merges, the runner posts a "Sprint N review" comment and stops. Son checks the site, the live checks and the found issues. |
| Retro and restart | Son | Plan found issues into a sprint (or leave them in the backlog), then add `loop-go` to any PR to start the next sprint. |

## The board (GitHub Projects)

GitHub's Projects API needs GraphQL, which cloud sessions can't use, so Son creates the board once in the GitHub UI:

1. github.com/son-nguyen-301 → Projects → New project → Board. Name it "Portfolio".
2. Workflows → turn on **Auto-add to project** with the filter `repo:son-nguyen-301/portfolio is:issue`, and add the existing issues once (in the project, type `repo:son-nguyen-301/portfolio` in "Add item", or use "Add items from repository").
3. Keep the default Status workflows: item added → Todo, item closed → Done, PR merged → Done.
4. Add a view grouped by **Milestone** (the sprints) and a view filtered by `label:epic,story` (the roadmap).

The runner does not touch the board. GitHub moves cards by itself when issues close.
