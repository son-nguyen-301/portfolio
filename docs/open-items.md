# Open items

Most of these are now `manual` tasks on the board (PF-025 to PF-029 and PF-032 to PF-034). Close them there. PF-030 (screenshots) was dropped on 2026-11-15.

Things that wait on Son. The build goes ahead with placeholders: a quote is `null` and hidden, and a media slot with a `TODO` shows a neutral placeholder until its diagram is built.

## Proof

- [ ] **Quotes from the NZ company:** the IT team leader and the project lead. Son has a ready message to send.
- [ ] **LinkedIn recommendations from Aspire.** Son has asked his former teammates. Use a quote only after it is written.
- [ ] **Paymentwall / Terminal3:** is there someone (PM or the other frontend developer) Son could ask for a recommendation?

No screenshots. Son decided on 2026-11-15 that case studies and Lab projects use diagrams instead (D-043). PF-059 built the two on the NZ storefront speed case study, and PF-060 built the three on the Lab page.

## Facts to check

- [ ] Son checks the Aspire case studies (`aspire-multi-currency`, `aspire-redesign`) and the Paymentwall one (`paymentwall-terminal3`), then sets `status: ready`.

## Hosting

Workers Builds deploys `main`, and the site is live at https://me.haisonnguyen.dev (Son checked on 2026-11-19).

- [ ] Turn on Cloudflare Web Analytics for the site. If Cloudflare does not add the beacon itself, set the public site token as `NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` in the Workers Builds build variables (D-025).
- [ ] Optional: delete the AWS leftovers by hand (see "AWS leftovers" in `docs/architecture.md`). Also delete the `CLOUDFLARE_API_TOKEN` GitHub secret if nothing else uses it.

## Left in content

`pnpm report:todo` (run from `app/`) lists every `TODO` in `app/content/`, every case study with `status: draft`, and every `TODO` a visitor sees on the built pages. This list matches it: `tests/unit/todo.test.ts` fails when a `TODO` or a draft in content is missing here, or when one listed here is gone from content. When you fix one, delete its line. No built page shows a `TODO` (report of 2026-11-12).

- [ ] `app/content/work/aspire-multi-currency.md`: `status: draft` (Facts to check above)
- [ ] `app/content/work/aspire-redesign.md`: `status: draft` (Facts to check above)
- [ ] `app/content/work/paymentwall-terminal3.md`: `status: draft` (Facts to check above)

The footer stats line is filled from a measured run (`siteStats` in `app/content/profile.yml`, PF-024). After launch, check it against the live site (`head/STATUS.md`, PF-024).

## Outside the site (Son)

- [ ] Upwork: new title, overview, skills (add PostgreSQL, Docker, AI agent development, Claude, workflow automation), profile visibility set to public, ID verification, English level, rate.
- [ ] Upwork: rename the portfolio item that names the current employer.
- [ ] Upwork and CV PDF: add the NZ role and set the Aspire end date to Jul 2026.
- [ ] GitHub: pin `portfolio` and `hydra-claude`, add the site link to the bio.
- [ ] Optional: rename the Cal.com link to something shorter. If it changes, update `app/content/profile.yml`.
