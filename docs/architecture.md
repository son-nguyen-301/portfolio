# Architecture

## Summary

A fully static Nuxt 4 site, built with `nuxt generate` and served by **Cloudflare Workers static assets** at `me.haisonnguyen.dev`. The `haisonnguyen.dev` zone is already on Cloudflare. No server code runs at request time, because there is no contact form.

The old AWS setup (S3, CloudFront, Lambda, ACM, and a DNS record pointing at CloudFront) was removed on 2026-11-10, and `infra/` was deleted from the repo. The site has no AWS parts.

Cloudflare now points new projects to Workers static assets instead of Pages. Static asset requests are free on both. Check the current docs before setup: https://developers.cloudflare.com/workers/static-assets/

## App

| Part | Choice | Notes |
| --- | --- | --- |
| Framework | Nuxt 4 (already in `app/package.json`), Vue 3, TypeScript | Remove the `nitro` block (`aws-lambda` preset, streaming) from `nuxt.config.ts`. Build with `nuxt generate`. Output: `app/.output/public`. |
| Content | `@nuxt/content` v3 | Collections in `app/content.config.ts` with zod schemas. See `docs/content-model.md`. Query content in pages so it is prerendered into the payload. |
| SEO | `@nuxtjs/seo` | Site config, sitemap, robots, schema.org (`Person`, `WebSite`, `CreativeWork` for case studies), Open Graph images prerendered at build. |
| Images | `@nuxt/image` | Static build. Fixed sizes. |
| Fonts | `@nuxt/fonts` | Bricolage Grotesque, Inter, JetBrains Mono, self-hosted. |
| Styles | Plain CSS with the tokens in `docs/design.md`, scoped component styles | No UI library and no Tailwind. Keeps JavaScript and CSS small. |
| Lint | `@nuxt/eslint` | |
| Tests | Vitest for composables (Upwork mode, time overlap math). Playwright for page smoke tests, Upwork mode, theme switch, no horizontal scroll at 360px. | |
| Package manager | pnpm (lock file exists) | Node 22.13 or newer (D-006). `app/.node-version` holds `22` for Workers Builds. |

Check current docs before adding modules (for example with the Context7 tool). Versions move fast.

### Composables

- `useUpworkMode()`: reads `?from=upwork`, stores it in session storage, returns a reactive boolean. Client-only. Covered by unit tests.
- `useTimeOverlap(visitorOffset, sonStart = 8, sonEnd = 22, sonOffset = 7, visitorStart = 9, visitorEnd = 17)`: pure math that returns the overlap in the visitor's time, including windows that cross midnight. `visitorOffset` is the visitor's UTC offset in hours, east positive (5.5 for UTC+5:30). The caller reads it from the browser: `Date.getTimezoneOffset()` gives minutes west of UTC, so pass `-new Date().getTimezoneOffset() / 60`. Built in PF-009, in `app/app/composables/useTimeOverlap.ts`. Unit tests for UTC+7, UTC+0, UTC+1, UTC−5, UTC−8, UTC+13 and a half-hour zone (UTC+5:30).

### CV PDF

Build `/cv` with a print stylesheet. A script (`pnpm cv:pdf`) prints `/cv` to `app/public/cv/hai-son-nguyen-cv.pdf` with Playwright. The PDF shows the email but never the phone number. The download link is hidden in Upwork mode.

## Hosting on Cloudflare

### Worker config

`app/wrangler.jsonc` (a Worker with static assets only, no script). Added in PR PF-023 and checked against the Cloudflare docs on 2026-11-11. `pnpm deploy:check` runs `wrangler deploy --dry-run` on it, with no login, and CI runs it after `pnpm generate`.

```jsonc
{
  "$schema": "./node_modules/wrangler/config-schema.json",
  "name": "portfolio",
  "compatibility_date": "2026-11-11",
  "assets": {
    "directory": "./.output/public",
    "not_found_handling": "404-page",
    "html_handling": "drop-trailing-slash"
  },
  "routes": [
    { "pattern": "me.haisonnguyen.dev", "custom_domain": true }
  ]
}
```

Check every field name against the current Cloudflare docs before you change it.

`html_handling` is `drop-trailing-slash`, because the canonical tags, the sitemap and every link on the site have no trailing slash (`/about`). With `auto-trailing-slash`, each of them was a 307 redirect to `/about/` (D-025).

`nuxt.config.ts` sets `nitro.preset` to `static`. Workers Builds sets `WORKERS_CI=1`, and without a preset Nitro then picks its Cloudflare preset, which prerenders no pages.

### Headers

`_headers` in the build output. It is not in `app/public/`: `app/modules/headers.ts` writes it after every page is prerendered, with the rules in `app/lib/headers.ts` (D-025). The Content Security Policy lists the hash of every inline script, and Nuxt's config script holds the build ID, so the hashes change with every build.

- All paths: `Strict-Transport-Security`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, a Content Security Policy that allows the Cloudflare analytics script, and `Cache-Control: public, max-age=0, must-revalidate`, so a new deploy shows up at once.
- `/_nuxt/*`: `Cache-Control: public, max-age=31536000, immutable` (the short cache is dropped first with `! Cache-Control`).
- `/_nuxt-skew-sw.js`: `Cache-Control: no-cache`.
- `/contact-details.json`, `/200` (the app's fallback page) and `/404`: `X-Robots-Tag: noindex`.
- `nuxt-ai-ready` adds its own `/*.md` rule after it.

### Deploy

Use **Workers Builds** (Cloudflare's Git integration). Cloudflare builds on every push and shows a preview link for pull requests. No API token is stored in GitHub.

- Repository: `son-nguyen-301/portfolio`, production branch `main`
- Root directory: `app`
- Build command: `pnpm install --frozen-lockfile && pnpm generate`
- Deploy command: `npx wrangler deploy`

Son connects the repo in the Cloudflare dashboard (Workers & Pages → Create → Import a repository). If he prefers GitHub Actions instead, use `cloudflare/wrangler-action` with a `CLOUDFLARE_API_TOKEN` secret.

GitHub Actions still runs `ci.yml` on pull requests: install, lint, unit tests, generate, and Playwright smoke tests on the generated site.

### DNS and the custom domain

The old CNAME for `me.haisonnguyen.dev` (pointing at CloudFront) was removed with the AWS stack, so the name is free. Cloudflare creates the DNS record itself when you add the Worker's custom domain. If a record for `me` shows up in the zone again before then, delete it first.

### AWS leftovers

Removed on 2026-11-10 by a one-time GitHub Actions job. A few things were made outside that Terraform, or kept on purpose, and Son can delete them by hand in the AWS console:
- the IAM role `github-terraform` and the GitHub OIDC identity provider
- the Terraform state bucket `haisonnguyen-portfolio-tfstate-…`
- the `portfolio-prod` AWS account itself, if nothing else uses it

## Analytics

Cloudflare Web Analytics (free, no cookies). Turn it on for the site in the Cloudflare dashboard. If the beacon is not added on its own, set the public site token as `NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` in the Workers Builds build variables. With a token, every page loads the beacon; with none (the default), no page holds it. The CSP allows the beacon either way. Track:
- page views and referrers (LinkedIn vs Upwork vs search)
- Upwork mode visits (`from=upwork`)
- clicks on "Book a call", "Copy email" and "Message me on Upwork"

Web Analytics has no custom events (its FAQ, checked on 2026-11-11). The buttons carry `data-track` (`book-call`, `copy-email`, `message-upwork`), and `app/utils/analytics.ts` sends them to `zaraz.track()` only when Cloudflare Zaraz is on the page. Until Son picks a tool, a click sends nothing.

## Link previews

LinkedIn and Upwork read Open Graph tags from the HTML. Every page needs a title, a description and a 1200 × 630 PNG image. Before sharing a link, check it with LinkedIn's Post Inspector, because LinkedIn caches the first version it sees.
