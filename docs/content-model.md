# Content model

All site content lives in `app/content/`. Pages read it with `@nuxt/content` v3. Define one collection per row below in `app/content.config.ts`, with a zod schema that matches the fields. The schemas live in `app/shared/content/schemas.ts`. `app/lib/content-check.ts` checks every file against them, so `pnpm test` and `pnpm generate` fail on a broken file. Pages read content through the composables in `app/app/composables/content.ts`.

Every fact in these files is approved for the public site. Do not add facts in components. If a page needs something that is not here, add a `TODO` and a line in `docs/open-items.md`.

| Collection | Type | Source | Holds |
| --- | --- | --- | --- |
| `profile` | data | `profile.yml` | Name, title, location, hours, contact links, headline, about text, roles, and the words of the `/work` page (`workList`: `intro`, and `more` for the line about the Lab and earlier projects) |
| `services` | data | `services.yml` | The 6 services, grouped |
| `timeline` | data | `timeline.yml` | Career entries and education |
| `skills` | data | `skills.yml` | Skill groups for About and CV |
| `work` | page | `work/*.md` | Case studies (Markdown body plus front matter) |
| `lab` | data | `lab/*.yml` | Side projects |
| `earlier` | data | `earlier.yml` | Short list of older projects (2019 to 2021) and "also built at" items |

## `work/*.md` front matter

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Page title |
| `summary` | string | One line for cards and the meta description |
| `client` | string | Name shown on the site. The current employer is always "A New Zealand e-commerce company". |
| `role` | string | |
| `team` | string | Optional |
| `stack` | string[] | |
| `period` | string | For example "Q3 to Q4 2025" |
| `order` | number | Sort order on `/work` |
| `featured` | boolean | Show on the home page |
| `status` | `ready` or `draft` | `draft` = Son still has to check the facts. Show it on the site, but list it in `docs/open-items.md`. |
| `cardMetric` | string | Short result line for the card, for example "UI library CSS −65%". Optional. |
| `metrics` | `{ value, label }[]` | Result tiles. Empty when there are no numbers. |
| `quote` | `{ text, role }` or `null` | `null` until a written quote exists |
| `media` | `{ type: image or diagram, src?, alt, caption? }[]` | Diagrams are inline SVG components named in `src` |

Body sections, always in this order, as `##` headings: "The problem", "What I did", "The result". Optional "Hard choice" callout inside "What I did".
