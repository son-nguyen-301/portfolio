// CI: which pull requests run which checks (.github/ci-scope.mjs), and the
// rules the workflows keep so "CI / check" can be a required check on `main`.
import { execFileSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import { parse } from 'yaml'

type Step = { name?: string, uses?: string, run?: string, if?: string, env?: Record<string, string>, with?: Record<string, string> }

const repo = fileURLToPath(new URL('../../..', import.meta.url)).replace(/\/$/, '')
const scopeScript = `${repo}/.github/ci-scope.mjs`
const workflow = parse(readFileSync(`${repo}/.github/workflows/ci.yml`, 'utf8'))
const job = workflow.jobs.check
const steps: Step[] = job.steps
const cacheWorkflow = parse(readFileSync(`${repo}/.github/workflows/cache.yml`, 'utf8'))
const cacheSteps: Step[] = cacheWorkflow.jobs.fill.steps
const scopeStep = steps.find(step => step.name === 'Find what changed')!

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
      // Its test only runs with the full checks.
      '.github/dependabot.yml',
      '.gitignore',
      'docs.md/x.ts',
      'some-new-folder/notes.md',
    ]) {
      expect(scope(['docs/brief.md', file]), file).toBe('app=true')
    }
  })

  it('treats an empty change list and empty lines as docs only', () => {
    expect(scope([])).toBe('app=false')
    expect(scope(['', 'head/STATUS.md', ''])).toBe('app=false')
  })

  it('does not trim paths', () => {
    expect(scope([' docs/evil.ts'])).toBe('app=true')
    expect(scope(['docs/brief.md', '  '])).toBe('app=true')
  })
})

// Runs the workflow's "Find what changed" step in a scratch git repo, on a
// commit whose first parent stands in for the base branch.
describe('the scope step on a real diff', () => {
  const dirs: string[] = []
  // Without GIT_DIR and the like, so git can only ever touch the scratch repo.
  const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !name.startsWith('GIT_')))
  afterAll(() => {
    for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
  })

  function runScope(change: (dir: string, git: (...args: string[]) => void) => void) {
    const dir = mkdtempSync(join(tmpdir(), 'ci-scope-'))
    dirs.push(dir)
    const git = (...args: string[]) => {
      execFileSync('git', ['-c', 'user.name=test', '-c', 'user.email=test@example.invalid', '-c', 'commit.gpgsign=false', ...args], { cwd: dir, env, stdio: 'pipe' })
    }
    const write = (path: string, text: string) => {
      mkdirSync(dirname(join(dir, path)), { recursive: true })
      writeFileSync(join(dir, path), text)
    }
    git('init', '-q')
    mkdirSync(join(dir, '.github'))
    copyFileSync(scopeScript, join(dir, '.github/ci-scope.mjs'))
    write('app/modules/example.ts', 'export default function example() {\n  return 1\n}\n')
    write('docs/brief.md', '# Brief\n')
    git('add', '-A')
    git('commit', '-q', '-m', 'base')
    change(dir, git)
    git('add', '-A')
    git('commit', '-q', '-m', 'change')
    const output = join(dir, 'output.txt')
    writeFileSync(output, '')
    execFileSync('bash', ['-eo', 'pipefail', '-c', scopeStep.run!], {
      cwd: dir,
      env: { ...env, RUNNER_TEMP: dir, GITHUB_OUTPUT: output },
      stdio: 'pipe',
    })
    return readFileSync(output, 'utf8').trim()
  }

  it('sees an app file moved into docs/ as an app change', () => {
    expect(runScope((_, git) => git('mv', 'app/modules/example.ts', 'docs/example.ts'))).toBe('app=true')
  })

  it('sees a deleted app file as an app change', () => {
    expect(runScope((_, git) => git('rm', '-q', 'app/modules/example.ts'))).toBe('app=true')
  })

  it('sees a docs edit as docs only', () => {
    expect(runScope(dir => writeFileSync(join(dir, 'docs/brief.md'), '# Brief\n\nMore.\n'))).toBe('app=false')
  })
})

describe('ci workflow', () => {
  it('has one job, named check, that runs on every non-draft PR into main', () => {
    expect(Object.keys(workflow.jobs)).toEqual(['check'])
    expect(workflow.on.pull_request.types).toEqual(['opened', 'synchronize', 'reopened', 'ready_for_review'])
    expect(workflow.on.pull_request.branches).toEqual(['main'])
    // A path filter on the trigger would leave a required check waiting forever.
    expect(workflow.on.pull_request.paths).toBeUndefined()
    expect(workflow.on.pull_request['paths-ignore']).toBeUndefined()
    expect(job.if).toBe('github.event.pull_request.draft == false')
  })

  it('cancels an older run on the same PR', () => {
    expect(workflow.concurrency).toEqual({ 'group': 'ci-${{ github.event.pull_request.number }}', 'cancel-in-progress': true })
  })

  it('pins every action in both workflows to a full commit SHA', () => {
    const actions = [...steps, ...cacheSteps].filter(step => step.uses).map(step => step.uses!)
    expect(actions.length).toBeGreaterThan(0)
    for (const action of actions) expect(action, action).toMatch(/^[\w.-]+\/[\w.-]+@[0-9a-f]{40}$/)
  })

  it('lists both paths of a moved file', () => {
    expect(scopeStep.run).toContain('git diff --no-renames --name-only HEAD^1 HEAD')
    expect(steps.find(step => step.uses?.startsWith('actions/checkout@'))?.with?.['fetch-depth']).toBe(2)
  })

  it('runs the guard on docs-only PRs and every check on the rest', () => {
    const run = (command: string) => steps.filter(step => step.run?.trim() === command)
    expect(run('pnpm test:guard').map(step => step.if)).toEqual([
      'steps.scope.outputs.app == \'false\'',
      'steps.scope.outputs.app != \'false\'',
    ])
    // `!= 'false'`: a missing or odd scope runs everything instead of nothing.
    for (const command of ['pnpm lint', 'pnpm typecheck', 'pnpm test', 'pnpm generate', 'pnpm deploy:check', 'pnpm test:e2e']) {
      expect(run(command).map(step => step.if), command).toEqual(['steps.scope.outputs.app != \'false\''])
    }
    for (const step of steps.filter(step => step.if?.includes('steps.scope.outputs.app'))) {
      expect(step.if, step.name ?? step.run).not.toContain('app == \'true\'')
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

  it('points apt at the main Ubuntu archive before anything installs with apt', () => {
    const index = (name: string) => steps.findIndex(step => step.name === name)
    const mirror = steps[index('Use the main Ubuntu archive for apt')]!
    expect(mirror.if).toBe('steps.scope.outputs.app != \'false\'')
    expect(mirror.run).toContain('http://archive.ubuntu.com/ubuntu/')
    for (const name of ['Install the Playwright browser', 'Install the browser\'s system libraries']) {
      expect(index(name), name).toBeGreaterThan(index('Use the main Ubuntu archive for apt'))
    }
    // Every step that runs apt comes after it.
    const apt = steps.filter(step => step !== mirror && /--with-deps|install-deps|apt-get|apt install/.test(step.run ?? ''))
    expect(apt.map(step => step.name)).toEqual(['Install the Playwright browser', 'Install the browser\'s system libraries'])
    for (const step of apt) expect(steps.indexOf(step), step.name).toBeGreaterThan(steps.indexOf(mirror))
  })

  it('scans the built site with a missing build failing the run', () => {
    const guard = steps.find(step => step.name === 'Banned-words guard on the built site')!
    expect(guard.env).toEqual({ GUARD_REQUIRE_BUILD: '1' })
    expect(steps.indexOf(guard)).toBeGreaterThan(steps.findIndex(step => step.run?.trim() === 'pnpm generate'))
  })
})

describe('cache workflow', () => {
  it('installs with no scripts', () => {
    expect(cacheSteps.find(step => step.name === 'Install')?.run).toBe('pnpm install --frozen-lockfile --ignore-scripts')
  })

  it('fills the caches on main when the lockfile or a workflow changes', () => {
    expect(cacheWorkflow.on.push).toEqual({ branches: ['main'], paths: ['app/pnpm-lock.yaml', '.github/workflows/**'] })
    expect(cacheWorkflow.on).toHaveProperty('workflow_dispatch')
    expect(cacheWorkflow.permissions).toEqual({ contents: 'read' })
  })

  it('saves the same cache keys that ci.yml restores', () => {
    const setupNode = (list: Step[]) => list.find(step => step.uses?.startsWith('actions/setup-node@'))
    expect(setupNode(cacheSteps)).toEqual(setupNode(steps))
    const browser = (list: Step[]) => list.find(step => step.uses?.startsWith('actions/cache@'))
    expect(browser(cacheSteps)?.uses).toBe(browser(steps)?.uses)
    expect(browser(cacheSteps)?.with).toEqual(browser(steps)?.with)
    const version = (list: Step[]) => list.find(step => step.name === 'Find the Playwright version')?.run
    expect(version(cacheSteps)).toBe(version(steps))
  })
})

describe('dependabot', () => {
  it('updates the GitHub Actions weekly, once a release is a week old', () => {
    const config = parse(readFileSync(`${repo}/.github/dependabot.yml`, 'utf8'))
    expect(config.updates).toEqual([expect.objectContaining({
      'package-ecosystem': 'github-actions',
      'directory': '/',
      'schedule': { interval: 'weekly' },
      'cooldown': { 'default-days': 7 },
    })])
  })
})
