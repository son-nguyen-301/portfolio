# me.haisonnguyen.dev

Portfolio site for Hai Son Nguyen, Senior Frontend Engineer (Vue and Nuxt) in Hanoi.

- Static Nuxt 4 site, content in `app/content/`, hosted on Cloudflare Workers static assets. Workers Builds deploys from `main`.
- Start with `CLAUDE.md`, then `docs/plan.md`. `app/README.md` explains the guard and the content check.

## Commands

Run them from `app/`, with Node 22.13 or newer and pnpm 10.

```bash
cd app
pnpm install --frozen-lockfile
pnpm dev            # the dev server
```

The checks, in the order CI runs them for a change to the app (a docs-only change runs just `pnpm test:guard`):

```bash
pnpm lint           # ESLint
pnpm typecheck      # TypeScript
pnpm test           # unit tests (Vitest), the banned-words guard included
pnpm generate       # the static site, into .output/public
pnpm deploy:check   # a dry run of the Workers config (app/wrangler.jsonc)
pnpm test:guard     # the guard again, now over the built site too
pnpm test:e2e       # browser tests (Playwright) on the built site, the link checker included
pnpm test:quality   # Lighthouse on every page, axe, 360 px, the home page's JavaScript budget
```

After a build:

- `pnpm report:todo` lists every `TODO` left in content and on the built pages, and the case studies still marked `status: draft`. Keep `docs/open-items.md` in step with it.
- `pnpm cv:pdf` prints `/cv` to `app/public/cv/hai-son-nguyen-cv.pdf`. Run `pnpm generate` again after it, and commit the PDF.

The footer's stats line comes from `siteStats` in `app/content/profile.yml`. When `pnpm test:quality` says the home page moved more than 5 from it, put the new numbers there.
