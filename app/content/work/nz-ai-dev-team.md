---
title: "An AI dev team that takes a ticket to a reviewed pull request"
summary: "I built a Claude Code pipeline that turns tickets into reviewed, merged pull requests, with a person approving each key step. 7 pull requests merged so far."
client: "A New Zealand e-commerce company"
role: "Senior Frontend Developer. I designed and built the setup."
team: "Small in-house team plus an outside vendor team"
stack: [Claude Code, Plugins, Subagents, Skills, GitHub Actions, monday.com MCP, git worktrees]
period: "Oct to Nov 2026"
order: 2
featured: true
status: ready
cardMetric: "7 agent-built PRs merged"
metrics:
  - value: "7"
    label: "Pull requests opened and merged, across 5 tickets (frontend and backend)"
  - value: "2"
    label: "Pull requests that passed AI review with 0 findings"
  - value: "< 3 h"
    label: "One ticket, from claimed to merged"
quote: null
media:
  - type: diagram
    src: DiagramAiPipeline
    alt: "Ticket → brief → plan → build test-first → pull request → AI review → person merges"
---

## The problem

Small tickets took a lot of hand work: read the ticket, find the code, write tests, open a pull request, get it reviewed.

AI tools could help. But on a live shop they must follow the repo's rules, never touch secrets and never merge on their own. Each new session also forgot what the last one learned.

## What I did

1. **Set up a shared, safe base.** I wrote a project guide for the AI and shared settings that allow test and lint commands but block reading environment files. I added AI review in CI, so every pull request gets automatic comments that a person then reads.
2. **Built a Claude Code plugin that runs one ticket end to end.** It has 5 subagents: ticket finder, requirements analyst, developer, pull request publisher and code reviewer. The flow: find a ready ticket, write a brief, plan, build test-first in its own git worktree, open a pull request to staging, run AI review with at most two fix rounds, then hand over.
3. **Kept people in charge.**
4. **Gave it a memory.** A shared memory repo that each run reads and adds to: team rules, repo patterns and corrections. Lessons from one run carry into the next. It holds 97 shared lessons so far.
5. **Made it work for the whole team.** The plugin runs as whoever starts it, and it ships as versioned releases.

> **Hard choice:** full autonomy would be faster. I chose hard stops instead. A person answers open questions, approves the design and does the merge. The agent never pushes to main or staging, never merges and only changes ticket statuses. Speed is worth less than trust when the code runs a live shop.

## The result

- 7 pull requests opened and merged across 5 tickets, frontend and backend.
- 2 passed AI review with 0 findings. The others were fixed in at most two rounds.
- One ticket went from claimed to merged in under 3 hours.
- The project lead set up the same kind of AI base for the backend the same week, and a backend developer reviewed and merged a pull request the agent built.
