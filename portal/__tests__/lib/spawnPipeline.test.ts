// __tests__/lib/spawnPipeline.test.ts
// Guards the prompt substitution: the portal's toggles only reach the pipeline
// if the placeholders in apply.md are actually filled in.
import fs from 'fs'
import os from 'os'
import path from 'path'

const spawnMock = jest.fn(() => ({ pid: 1234, on: jest.fn(), unref: jest.fn() }))
jest.mock('child_process', () => ({ spawn: (...args: unknown[]) => spawnMock(...(args as [])) }))
jest.mock('@/lib/db', () => ({ updateApplication: jest.fn(), getApplication: jest.fn(() => null) }))

const APPLY_MD = [
  'Job input: $ARGUMENTS',
  'Web research: $WEB_RESEARCH',
  'Cover letter: $COVER_LETTER',
  'Skip analysis: $SKIP_ANALYSIS',
  'App ID: $APP_ID',
].join('\n')

let root: string

beforeEach(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'jobz-'))
  fs.mkdirSync(path.join(root, '.claude/commands'), { recursive: true })
  fs.writeFileSync(path.join(root, '.claude/commands/apply.md'), APPLY_MD)
  process.env.PROJECT_ROOT = root
  spawnMock.mockClear()
})

afterEach(() => {
  delete process.env.PROJECT_ROOT
  fs.rmSync(root, { recursive: true, force: true })
})

function promptFrom(call: unknown[]): string {
  const opts = call[2] as { env: Record<string, string> }
  return opts.env.CLAUDE_PROMPT
}

test('cover letter is disabled by default', async () => {
  const { spawnPipeline } = await import('@/lib/pipeline')
  spawnPipeline(1, 'some jd')
  const prompt = promptFrom(spawnMock.mock.calls[0])
  expect(prompt).toContain('Cover letter: disabled')
  expect(prompt).toContain('Web research: disabled')
})

test('cover letter and web research flags reach the prompt when enabled', async () => {
  const { spawnPipeline } = await import('@/lib/pipeline')
  spawnPipeline(1, 'some jd', true, false, true)
  const prompt = promptFrom(spawnMock.mock.calls[0])
  expect(prompt).toContain('Cover letter: enabled')
  expect(prompt).toContain('Web research: enabled')
  expect(prompt).toContain('Job input: some jd')
  expect(prompt).toContain('Skip analysis: false')
  expect(prompt).not.toContain('$COVER_LETTER')
})
