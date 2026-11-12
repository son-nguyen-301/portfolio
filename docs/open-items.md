# Open items

Most of these are now `manual` tasks on the board (PF-025 to PF-030 and PF-032 to PF-034). Close them there.

Things that wait on Son. The build goes ahead with placeholders: a quote is `null` and hidden, an image has a `TODO` caption and shows a neutral placeholder.

## Proof

- [ ] **Quotes from the NZ company:** the IT team leader and the project lead. Son has a ready message to send.
- [ ] **LinkedIn recommendations from Aspire.** Son has asked his former teammates. Use a quote only after it is written.
- [ ] **Paymentwall / Terminal3:** is there someone (PM or the other frontend developer) Son could ask for a recommendation?
- [ ] **Terminal3 screenshots:** Son opens the Internet Archive copies (Nov 2021 and Apr 2022) and takes 2 or 3 screenshots, or we keep the diagram.
- [ ] **NZ storefront screenshots** from staging with a test account: room home page with hero, UI kit gallery, Favourites page, CI test results comment. Blur the company name, logo, prices, customer and coworker names, repo and pull request numbers.
- [ ] **Lab media:** short screen videos or screenshots of hydra-claude and the task runner (no company data), a Looper screenshot, a Homereel TV home screen (app screens only).

## Facts to check

- [ ] Son checks the Aspire case studies (`aspire-multi-currency`, `aspire-redesign`) and the Paymentwall one (`paymentwall-terminal3`), then sets `status: ready`.

## Hosting

- [ ] Connect the repo in Cloudflare Workers Builds (root `app`, build `pnpm install --frozen-lockfile && pnpm generate`, deploy `npx wrangler deploy`).
- [ ] Add the Worker custom domain `me.haisonnguyen.dev` (the old CloudFront record is already gone).
- [ ] Turn on Cloudflare Web Analytics for the site. If Cloudflare does not add the beacon itself, set the public site token as `NUXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN` in the Workers Builds build variables (D-025).
- [ ] "Workers Builds: portfolio" fails before any build command runs. Read its log in the Cloudflare dashboard and check the build settings above.
- [ ] Optional: delete the AWS leftovers by hand (see "AWS leftovers" in `docs/architecture.md`). Also delete the `CLOUDFLARE_API_TOKEN` GitHub secret if nothing else uses it.

## Left in content

`pnpm report:todo` (run from `app/`) lists every `TODO` in `app/content/`, every case study with `status: draft`, and every `TODO` a visitor sees on the built pages. This list matches it: `tests/unit/todo.test.ts` fails when a `TODO` or a draft in content is missing here, or when one listed here is gone from content. When you fix one, delete its line. No built page shows a `TODO` (report of 2026-11-12).

- [ ] `app/content/lab/homereel.yml`: "TODO: screenshot of the TV home screen" (Lab media above)
- [ ] `app/content/lab/hydra-claude.yml`: "TODO: screenshot or short video of a saved rule being applied" (Lab media above)
- [ ] `app/content/lab/looper.yml`: "TODO: screenshot of the Looper UI" (Lab media above)
- [ ] `app/content/work/nz-storefront-speed-ui-swap.md`: "TODO: screenshot from staging, company name and prices blurred" (NZ storefront screenshots above)
- [ ] `app/content/work/nz-storefront-speed-ui-swap.md`: "TODO: screenshot from staging" (NZ storefront screenshots above)
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
