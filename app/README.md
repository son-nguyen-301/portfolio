# App

The Nuxt 4 app for Hai Son Nguyen's portfolio at https://me.haisonnguyen.dev. It builds a static site.

- `pnpm install` installs the packages. `pnpm dev` starts the dev server.
- `pnpm generate` builds the static site into `.output/public`.
- `pnpm lint` runs ESLint. `pnpm typecheck` checks the TypeScript.
- `pnpm test` runs the unit tests with Vitest, including the banned-words guard. `pnpm test:guard` runs only the guard.
- `pnpm test:e2e` runs the browser tests with Playwright against `.output/public`, on port 4173. Run `pnpm generate` first. Set `E2E_PORT` to run two at once; a busy port fails the run.
- `pnpm test:quality` runs Lighthouse on every page, axe, the 360 px check and the home page's JavaScript budget, on port 4174 (D-038). It also fails when the home page drifts more than 5 from `siteStats` in `content/profile.yml`, the footer's stats line.
- `pnpm report:todo` lists every `TODO` in `content/`, the case studies with `status: draft`, and every `TODO` a visitor sees on the built pages. `docs/open-items.md` must list the same TODOs and drafts (`tests/unit/todo.test.ts`).

The link checker (`lib/links.ts`, run by `tests/e2e/links.spec.ts`) reads every built page, stylesheet, Markdown copy, text file and the sitemap. Every internal link, the site's own full URLs included, must resolve the way Workers serves the site (`lib/workers-assets.ts`): a file with status 200, not a redirect or the 404 page. A `#part` must name an element on the target page. Every external link must be https. `mailto:`, `tel:` and `data:` links are skipped.

The banned-words guard (`tests/guard.ts`) reads `content/`, `app/`, `public/`, every file tracked by git and, once built, `.output/public`, including the names of all files, images too. It fails on any word whose SHA-256 hash is in `tests/banned-words.json`, and on Vietnamese phone numbers (`+84`, `0084`, `wa.me/84`, `phone=84`). It first decodes HTML entities and %-codes, folds fullwidth letters and drops invisible characters, and it checks the pieces of camelCase names. A report shows the file, the line and the hash; a folder or file name that holds a banned word shows as `<hidden>`. The list holds hashes only, so the blocked words are never written in this public repo. To block a new word, add the SHA-256 hash of the lowercase word.

The content check (`lib/content-check.ts`) reads every file in `content/` and checks it against its zod schema in `shared/content/schemas.ts`, the same schemas `content.config.ts` gives Nuxt Content. It also checks that case studies have the headings "The problem", "What I did" and "The result" in order, that no two case studies or Lab projects share an `order`, that each service's `proof` names a real case study, and that every file belongs to a collection. `modules/content-check.ts` runs it at the start of `pnpm generate` and stops the build on any problem; Nuxt Content alone would only log a warning and leave the file out. In `pnpm dev` it logs the problems once at start instead. The browser test `tests/e2e/contact-details.spec.ts` fails when a built page file holds the email or the booking link from `content/profile.yml`, so read the profile with `useProfile('name', ...)` and name only the fields a page shows.
