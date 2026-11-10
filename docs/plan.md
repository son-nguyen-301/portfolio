# Build plan

Do the tasks in order. Each one is a pull request into `main` with its "done when" checks passing. Read `CLAUDE.md` and the docs it lists before starting.

## 1. Clean setup

- Remove the `nitro` AWS Lambda block from `app/nuxt.config.ts`. Replace the starter `app/app/app.vue` with `<NuxtLayout><NuxtPage /></NuxtLayout>`.
- Add `@nuxt/content`, `@nuxtjs/seo`, `@nuxt/image`, `@nuxt/fonts`, `@nuxt/eslint`, Vitest and Playwright.
- Site config: name "Hai Son Nguyen", URL `https://me.haisonnguyen.dev`, language `en`.
- Add `ci.yml` for pull requests: install, lint, unit tests, `pnpm generate`.

**Done when:** `pnpm generate` builds an empty static site with no errors, lint passes and CI is green.

## 2. Content collections

- Write `app/content.config.ts` with the collections and zod schemas in `docs/content-model.md`.

**Done when:** every file in `app/content/` passes its schema, and a test page can list all case studies in `order`.

## 3. Design tokens and base components

- `app/app/assets/css/`: tokens (light and dark, three theme states), base styles, type scale from `docs/design.md`.
- Components: `AppButton`, `MetricTile`, `TagList`, `QuoteBlock`, `ThemeSwitch`, `SiteHeader`, `SiteFooter`, default layout.

**Done when:** a component gallery page (dev only) shows each component in light and dark, contrast passes WCAG AA, and nothing scrolls sideways at 360px.

## 4. Upwork mode and contact

- `useUpworkMode()` and `ContactBlock` as described in `docs/brief.md`.
- Header button and contact links switch in Upwork mode.

**Done when:** unit tests cover the composable. A Playwright test opens `/?from=upwork`, then visits 3 other pages, and finds no email, no Cal.com link and no `/contact` link on any of them. Without `from=upwork`, the email and booking link show.

## 5. Time overlap clock

- `useTimeOverlap()` math plus the `TimeOverlap` component from `docs/design.md`.

**Done when:** unit tests pass for the time zones listed in `docs/architecture.md`, and the server-rendered page shows the neutral version with no layout shift when the client version loads.

## 6. Home page

- Sections in the order given in `docs/design.md`, all copy from `profile.yml`, `services.yml` and `work/`.

**Done when:** the page matches the section order, the two hire paths work, and Lighthouse mobile scores are Performance 95+, Accessibility 100, Best Practices 100 and SEO 100 on the generated site.

## 7. Work pages

- `/work` list and `/work/[slug]` template with side panel, story, metrics, media (images or diagram components), quote (hidden when `null`), next and previous links.
- Diagram components named in the content files: `DiagramAiPipeline`, `DiagramRoomsByUrl`, `DiagramMultiCurrency`, `DiagramFeatureFlag`, `DiagramCmsPages`, `DiagramTaskRunner`. Inline SVG, colors from tokens.
- Image slots with a `TODO` caption show a neutral placeholder, never a broken image.

**Done when:** all 6 case studies render, the current employer's name appears nowhere in the built HTML (add a test that searches `.output/public`), and each page has its own Open Graph image.

## 8. Services, About, Lab, CV, Contact, 404

- `/services`: the 6 services grouped, "How I work", AI rules, pricing line, contact.
- `/about`: about text, timeline, skills, earlier projects, languages, hours.
- `/lab`: 4 cards from `lab/`.
- `/cv`: timeline, skills, education, print stylesheet. `pnpm cv:pdf` writes the PDF. Download hidden in Upwork mode.
- `/contact`: `ContactBlock` with hours and reply promise.
- `404`: short message and links home and to work.

**Done when:** every page passes the same Lighthouse and no-scroll checks as the home page.

## 9. SEO and previews

- Titles and descriptions per page, sitemap, robots, schema.org `Person` (name, job title, links), canonical URLs, Open Graph images (1200 × 630 PNG).

**Done when:** every built page has `og:title`, `og:description` and `og:image` in the static HTML, and the sitemap lists every page.

## 10. Cloudflare hosting

- Add `app/wrangler.jsonc` and `app/public/_headers` as in `docs/architecture.md`.
- Son connects the repo in Workers Builds and removes the old DNS record (see `docs/open-items.md`).

**Done when:** `https://me.haisonnguyen.dev` serves the site over HTTPS from Cloudflare, `/about` and `/about/` both work, an unknown path shows the 404 page with status 404, and the security headers are present.

## 11. Remove AWS

- After step 10 is live and Son agrees: `terraform destroy`, then delete `infra/` and `.github/workflows/verify-aws.yml`.

**Done when:** no AWS resources from this project are left, and the repo has no AWS files.

## 12. Launch

- Check every page with LinkedIn Post Inspector.
- Son adds the site to LinkedIn (Featured and Contact info), GitHub bio and Upwork (portfolio items link to case studies with `?from=upwork`).
- Fill in the footer stats line with real Lighthouse numbers.

**Done when:** LinkedIn shows a correct preview card, and every link Son put on Upwork opens in Upwork mode.
