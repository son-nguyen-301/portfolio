// CI: which pull requests run which checks (.github/ci-scope.mjs), and the
// rules the workflow keeps so "CI / check" can be a required check on `main`.
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'

const repo = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const scopeScript = `${repo}/.github/ci-scope.mjs`

function scope(files: string[]) {
  return execFileSync(process.execPath, [scopeScript], { input: files.join('\n'), encoding: 'utf8' }).trim()
}

describe('ci-scope', () => {
  it('runs only the guard when every change is a doc', () => {
    expect(scope([
      'docs/brief.md',
      'docs/design/Main.dc.html',
      'head/STATUS.md',
      'head/QUEUE.md',
      '.claude/memory/plugin/MEMORY.md',
      'CLAUDE.md',
      'README.md',
      '.github/dependabot.yml',
    ])).toBe('app=false')
  })

  it('runs everything when one change is outside the docs', () => {
    for (const file of [
      'app/app/pages/index.vue',
      'app/content/profile.yml',
      'app/content/case-studies/example.md',
      'app/README.md',
      'app/pnpm-lock.yaml',
      '.github/workflows/ci.yml',
      '.github/ci-scope.mjs',
      '.gitignore',
      'docs.md/x.ts',
      'some-new-folder/notes.md',
    ]) {
      expect(scope(['docs/brief.md', file]), file).toBe('app=true')
    }
  })

  it('treats an empty change list and blank lines as docs only', () => {
    expect(scope([])).toBe('app=false')
    expect(scope(['', '  ', 'head/STATUS.md', ''])).toBe('app=false')
  })
})

describe('ci workflow', () => {
  const workflow = parse(readFileSync(`${repo}/.github/workflows/ci.yml`, 'utf8'))
  const job = workflow.jobs.check
  const steps: Array<{ name?: string, uses?: string, run?: string, if?: string }> = job.steps

  it('has one job, named check, that runs on every non-draft PR', () => {
    expect(Object.keys(workflow.jobs)).toEqual(['check'])
    expect(workflow.on.pull_request.types).toEqual(['opened', 'synchronize', 'reopened', 'ready_for_review'])
    // A path filter on the trigger would leave a required check waiting forever.
    expect(workflow.on.pull_request.paths).toBeUndefined()
    expect(workflow.on.pull_request['paths-ignore']).toBeUndefined()
    expect(job.if).toBe('github.event.pull_request.draft == false')
  })

  it('cancels an older run on the same PR', () => {
    expect(workflow.concurrency).toEqual({ 'group': 'ci-${{ github.event.pull_request.number }}', 'cancel-in-progress': true })
  })

  it('pins every action to a full commit SHA', () => {
    const actions = steps.filter(step => step.uses).map(step => step.uses!)
    expect(actions.length).toBeGreaterThan(0)
    for (const action of actions) expect(action, action).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/)
  })

  it('runs the guard on docs-only PRs and every check on the rest', () => {
    const appIs = (value: 'true' | 'false') => `steps.scope.outputs.app == '${value}'`
    const run = (command: string) => steps.filter(step => step.run?.trim() === command)
    expect(run('pnpm test:guard').map(step => step.if)).toEqual([
      appIs('false'),
      appIs('true'),
    ])
    for (const command of ['pnpm lint', 'pnpm typecheck', 'pnpm test', 'pnpm generate', 'pnpm deploy:check', 'pnpm test:e2e']) {
      expect(run(command).map(step => step.if), command).toEqual([appIs('true')])
    }
    // Install runs for both kinds of PR.
    expect(run('pnpm install --frozen-lockfile').map(step => step.if)).toEqual([undefined])
  })

  it('runs stage 1 before the build and the browser tests', () => {
    const index = (command: string) => steps.findIndex(step => step.run?.trim() === command)
    const stage1 = ['pnpm lint', 'pnpm typecheck', 'pnpm test'].map(index)
    const stage2 = ['pnpm generate', 'pnpm deploy:check', 'pnpm test:e2e'].map(index)
    for (const i of [...stage1, ...stage2]) expect(i).toBeGreaterThan(-1)
    expect(Math.max(...stage1)).toBeLessThan(Math.min(...stage2))
  })

  it('scans the built site with a missing build failing the run', () => {
    const guard = job.steps.find((step: { name?: string }) => step.name === 'Banned-words guard on the built site')
    expect(guard.env).toEqual({ GUARD_REQUIRE_BUILD: '1' })
    expect(steps.indexOf(guard)).toBeGreaterThan(steps.findIndex(step => step.run?.trim() === 'pnpm generate'))
  })
})

describe('dependabot', () => {
  it('updates the GitHub Actions weekly', () => {
    const config = parse(readFileSync(`${repo}/.github/dependabot.yml`, 'utf8'))
    expect(config.updates).toEqual([expect.objectContaining({
      'package-ecosystem': 'github-actions',
      'directory': '/',
      'schedule': { interval: 'weekly' },
    })])
  })
})
