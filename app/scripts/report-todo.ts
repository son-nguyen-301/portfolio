// `pnpm report:todo` (PF-024, D-039): prints every TODO left in content, the
// case studies still marked `status: draft`, and every TODO a visitor sees on
// the built pages. Run `pnpm generate` first for the last part. Keep
// docs/open-items.md in step with it; tests/unit/todo.test.ts checks the
// content part.
import { fileURLToPath } from 'node:url'
import { formatReport, todoReport } from '../lib/todo.ts'

const app = fileURLToPath(new URL('..', import.meta.url))
const repo = fileURLToPath(new URL('../..', import.meta.url))

process.stdout.write(formatReport(todoReport(app, repo)))
