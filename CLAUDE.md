# Portfolio site for Hai Son Nguyen

This repo holds Son's portfolio site at https://me.haisonnguyen.dev. People reach it from LinkedIn and Upwork. Its job: get Son hired, for freelance projects and for full-time remote roles.

## Read first

| File | What it holds |
| --- | --- |
| `docs/brief.md` | Who Son is, who the site is for, the offer, services, roles, contact rules |
| `docs/design.md` | Design direction A: tokens, fonts, layout, components, page layouts, UX details |
| `docs/content-model.md` | The content files in `app/content/` and their fields |
| `docs/architecture.md` | Stack, static build, AWS and Terraform changes, deploy |
| `docs/plan.md` | Build tasks in order, each with "done when" checks |
| `docs/open-items.md` | Things still waiting on Son. Use placeholders for these. |
| `docs/writing-style.md` | How every word on the site is written |

The design proposal (with research and mockups) is a private page: https://claude.ai/artifact/P2Sn4zS5bKD5VxTusb9iqt. The docs above are the source of truth when they differ.

## Hard rules

1. **Never name Son's current employer.** On the site it is "a New Zealand e-commerce company". No company name, domain, link, logo, coworker names, pull request numbers, commit hashes or ticket IDs.
2. **Only publish facts that are in `app/content/`.** Do not add numbers, clients or claims. If copy needs a fact that is missing, leave a visible `TODO` and add it to `docs/open-items.md`.
3. **Never commit private source notes.** Son has a private facts document about his current job. It must never be in this repo. This repo is public.
4. **Upwork mode.** Pages opened from Upwork must show no email, no booking link and no phone number. See `docs/brief.md`.
5. **No prices on the site.**
6. **No photo of Son for now.**
7. **Write in plain English.** Follow `docs/writing-style.md` for all site copy, docs, commit messages and pull requests.

## Project layout

- `app/`: the Nuxt 4 app (pnpm). Run commands from here.
  - `app/app/`: pages, components, composables, assets
  - `app/content/`: site content (Markdown and YAML) read by Nuxt Content
  - `app/public/`: static files
- `infra/`: old Terraform for AWS (S3, CloudFront, Lambda, ACM) and one Cloudflare DNS record. It is being replaced by Cloudflare hosting. Don't build on it.
- `.github/workflows/`: CI
- `.claude/memory/plugin/`: project memory (decisions and rules). Read `MEMORY.md` there.

## Commands

```bash
cd app && pnpm install
```

```bash
cd app && pnpm dev
```

```bash
cd app && pnpm generate
```

## Hosting

- The site is static (`nuxt generate`) and runs on **Cloudflare Workers static assets** at `me.haisonnguyen.dev`. The `haisonnguyen.dev` zone is on Cloudflare.
- Cloudflare Workers Builds deploys from `main`. See `docs/architecture.md`.
- The AWS stack in `infra/` gets removed after the Cloudflare site is live, and only when Son says so. Never run `terraform apply` or `terraform destroy` without Son's go-ahead.
