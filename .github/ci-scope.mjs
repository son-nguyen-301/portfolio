// Decides how much of CI a pull request needs. Reads the changed file paths,
// one per line, on stdin and prints `app=true` or `app=false` for
// $GITHUB_OUTPUT.
//
// `app=false` means every changed file is a doc: `docs/` (design mockups
// included), `head/`, `.claude/`, a Markdown file at the repo root, or the
// Dependabot config. Those still need the banned-words guard, because the repo
// is public and the guard scans every tracked file. Any other path, or a path
// this list does not know, runs every check.
import { readFileSync } from 'node:fs'

const docs = [
  /^docs\//,
  /^head\//,
  /^\.claude\//,
  /^[^/]+\.md$/,
  /^\.github\/dependabot\.yml$/,
]

const files = readFileSync(0, 'utf8').split('\n').map(line => line.trim()).filter(Boolean)
const app = files.some(file => !docs.some(pattern => pattern.test(file)))

process.stdout.write(`app=${app}\n`)
