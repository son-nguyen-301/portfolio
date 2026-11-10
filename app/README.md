# App

The Nuxt 4 app for Hai Son Nguyen's portfolio at https://me.haisonnguyen.dev. It builds a static site.

- `pnpm install` installs the packages. `pnpm dev` starts the dev server.
- `pnpm generate` builds the static site into `.output/public`.
- `pnpm lint` runs ESLint. `pnpm typecheck` checks the TypeScript.
- `pnpm test` runs the unit tests with Vitest, including the banned-words guard. `pnpm test:guard` runs only the guard.
- `pnpm test:e2e` runs the browser tests with Playwright against `.output/public`. Run `pnpm generate` first.

The banned-words guard (`tests/guard.ts`) reads `content/`, `app/`, `public/` and, once built, `.output/public`. It fails on any word whose SHA-256 hash is in `tests/banned-words.json`, and on Vietnamese phone numbers (`+84`). The list holds hashes only, so the blocked words are never written in this public repo. To block a new word, add the SHA-256 hash of the lowercase word.
