// lib/pipeline.ts
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { getApplication, updateApplication } from './db'

function projectRoot(): string {
  return process.env.PROJECT_ROOT ?? path.resolve(process.cwd(), '..')
}

function logPath(appId: number): string {
  return path.join(projectRoot(), '.pipeline-logs', `${appId}.log`)
}

/**
 * Read the pipeline log from disk. The child process writes here directly via
 * its stdio file descriptors, so output survives Next.js dev-server restarts.
 */
export function readPipelineLog(appId: number): string {
  try {
    return fs.readFileSync(logPath(appId), 'utf-8')
  } catch {
    return ''
  }
}

/** Append text (markers, etc.) to the pipeline log file. */
export function appendPipelineLog(appId: number, text: string): void {
  const p = logPath(appId)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.appendFileSync(p, text)
}

export interface PipelineStep {
  name: string
  status: 'pending' | 'in_progress' | 'done'
  detail?: string
}

export interface AtsBreakdown {
  keyword: number
  keywordNote?: string
  quantified: number
  quantifiedNote?: string
  sections: number
  sectionsNote?: string
  formatting: number
  formattingNote?: string
  actionVerbs: number
  actionVerbsNote?: string
}

export interface AtsResult {
  score: number
  breakdown: AtsBreakdown
  iterations: number[]
}

export const STALE_THRESHOLD_MS = 15 * 60 * 1000

export function getCurrentRunLog(log: string): string {
  let latestIdx = -1
  for (const marker of ['[RESTART:', '[REVISE REQUEST]', '[REVISE REQUEST:', '[PIPELINE_START:']) {
    const idx = log.lastIndexOf(marker)
    if (idx > latestIdx) latestIdx = idx
  }
  return latestIdx === -1 ? log : log.slice(latestIdx)
}

export type StalledState = 'running' | 'stalled' | 'crashed'

export function getStalledState(app: { id: number; status: string; pid?: number | null }): StalledState | null {
  if (app.status !== 'generating') return null
  // Check only the current run's log so previous runs' exit markers don't interfere
  const currentRunLog = getCurrentRunLog(readPipelineLog(app.id))
  const exitMatch = currentRunLog.match(/\[PIPELINE_EXIT:(\d+)\]/)
  if (exitMatch) {
    if (exitMatch[1] !== '0') return 'crashed'
    // Exit 0 but no final report = Claude responded conversationally instead of running the pipeline
    return currentRunLog.includes('APPLICATION:') ? 'running' : 'crashed'
  }
  // PID check: is the process still alive?
  if (app.pid) {
    try {
      process.kill(app.pid, 0) // throws if process no longer exists
      return 'running'
    } catch {
      return 'stalled'
    }
  }
  // Fallback: PID unknown (server restarted mid-run) — use the log file's mtime
  try {
    const mtime = fs.statSync(logPath(app.id)).mtimeMs
    if (Date.now() - mtime > STALE_THRESHOLD_MS) return 'stalled'
  } catch {
    return 'stalled'
  }
  return 'running'
}

export function parsePipelineSteps(log: string): PipelineStep[] {
  const steps: PipelineStep[] = [
    { name: 'Job Analyzed', status: 'pending' },
    { name: 'CV & Cover Letter Written', status: 'pending' },
    { name: 'ATS Check', status: 'pending' },
    { name: 'Compile PDFs', status: 'pending' },
  ]

  const done = (s: string) => log.includes(s)

  // Step 1: Analyzer
  if (done('Analyzer Agent')) steps[0].status = 'in_progress'
  if (done('/brief.md')) {  // matches Write tool log: → Write: .../brief.md
    steps[0].status = 'done'
    steps[1].status = 'in_progress'
  }

  // Step 2: Writer — only advance to in_progress on first writer spawn (not re-iterations)
  if (done('Writer Agent') && steps[0].status === 'done' && steps[1].status === 'pending') {
    steps[1].status = 'in_progress'
  }
  // "ATS Checker" appears in orchestrator text right when the writer finishes
  if (done('ATS Checker') && steps[0].status === 'done') {
    steps[1].status = 'done'
    steps[2].status = 'in_progress'
  }

  // Step 3: ATS — show the latest iteration number
  const iterMatches = [...log.matchAll(/iteration (\d+)/gi)]
  const iterMatch = iterMatches.at(-1)
  if (iterMatch && steps[2].status === 'in_progress') {
    steps[2].detail = `iteration ${iterMatch[1]} of 3`
  }
  // Phase 4 tectonic runs from project root: "tectonic applications/..."
  // Writer's tectonic runs from app dir: "cd .../app && tectonic cv.tex" — no "applications/" after tectonic
  if (done('tectonic applications/')) {
    steps[2].status = 'done'
    steps[3].status = 'in_progress'
  }

  // Step 4: Compile
  if (done('APPLICATION:')) {
    steps[2].status = 'done'
    steps[3].status = 'done'
  }

  return steps
}

export function parseAtsResult(log: string): AtsResult | null {
  const scoreMatches = [...log.matchAll(/ATS SCORE:\s*(\d+)\/100/g)]
  if (!scoreMatches.length) return null
  const score = parseInt(scoreMatches[scoreMatches.length - 1][1])

  const n = (pattern: RegExp) => {
    const m = log.match(pattern)
    return m ? parseInt(m[1]) : 0
  }

  const breakdown: AtsBreakdown = {
    keyword:      n(/Keyword Match:\s*(\d+)\/35/),
    quantified:   n(/Quantified Achievements:\s*(\d+)\/25/),
    sections:     n(/Section Completeness:\s*(\d+)\/20/),
    formatting:   n(/Formatting:\s*(\d+)\/12/),
    actionVerbs:  n(/Action Verbs:\s*(\d+)\/8/),
  }

  const historyMatch = log.match(/Score history:\s*([0-9→ ]+)/)
  const iterations = historyMatch
    ? historyMatch[1].split(/\s*→\s*/).map(Number).filter(n => !isNaN(n))
    : [score]

  return { score, breakdown, iterations }
}

export function parseCurrentAtsScore(log: string): number | null {
  const matches = [...log.matchAll(/TOTAL SCORE:\s*(\d+)\/100/g)]
  if (!matches.length) return null
  return parseInt(matches[matches.length - 1][1])
}

export function parseMissingKeywords(log: string): string[] {
  const missing: string[] = []
  const gapMatches = [...log.matchAll(/✗ Missing:([^\n]+)/g)]
  for (const m of gapMatches) {
    const keywords = m[1].split(',').map(k => k.trim()).filter(Boolean)
    missing.push(...keywords)
  }
  return [...new Set(missing)]
}

export function parseRevisionHistory(log: string): string[] {
  const results: string[] = []
  // New block format: [REVISE REQUEST]\nfeedback\n[/REVISE REQUEST]
  for (const m of log.matchAll(/\[REVISE REQUEST\]\n([\s\S]*?)\n\[\/REVISE REQUEST\]/g)) {
    results.push(m[1].trim())
  }
  // Legacy single-line format: [REVISE REQUEST: feedback]
  for (const m of log.matchAll(/\[REVISE REQUEST: ([^\n\]]+)\]/g)) {
    results.push(m[1].trim())
  }
  return results
}

export interface JobMatchBreakdown {
  skills:     { score: number; matched: string[]; gaps: string[] }
  experience: { score: number; notes: string }
  education:  { score: number; notes: string }
  domain:     { score: number; notes: string }
}

export function parseJobMatchResult(log: string): { overall: number; breakdown: JobMatchBreakdown } | null {
  const matches = [...log.matchAll(/\[JOB_MATCH_START\]\n([\s\S]*?)\n\[JOB_MATCH_END\]/g)]
  if (!matches.length) return null
  try { return JSON.parse(matches[matches.length - 1][1]) } catch { return null }
}

export function parseMatchedKeywords(log: string): string[] {
  const matched: string[] = []
  const presentMatches = [...log.matchAll(/✓ Present:\s*([^\n]+)/g)]
  for (const m of presentMatches) {
    const keywords = m[1].split(',').map(k => k.trim()).filter(Boolean)
    matched.push(...keywords)
  }
  return [...new Set(matched)]
}

export interface KeywordGroup {
  category: string
  keywords: string[]
}

export function parseKeywordsFromBrief(briefText: string): KeywordGroup[] {
  const atsSectionMatch = briefText.match(/## ATS Keyword List([\s\S]*)/)
  if (!atsSectionMatch) return []
  const groups: KeywordGroup[] = []
  const subsections = atsSectionMatch[1].split(/\n### /).filter(s => s.trim())
  for (const sub of subsections) {
    const lines = sub.trim().split('\n')
    const category = lines[0].trim()
    const keywords = lines.slice(1).map(l => l.trim().replace(/^[-*]\s+/, '')).filter(l => l && !l.startsWith('#'))
    if (keywords.length) groups.push({ category, keywords })
  }
  return groups
}


export function finalizeIfComplete(applicationId: number): void {
  const app = getApplication(applicationId)
  if (!app || app.status !== 'generating') return
  const currentRunLog = getCurrentRunLog(readPipelineLog(applicationId))
  if (!currentRunLog.includes('APPLICATION:')) return
  const atsResult = parseAtsResult(currentRunLog)
  if (!atsResult) return
  const jobMatch = parseJobMatchResult(currentRunLog)
  updateApplication(app.id, {
    status: 'generated',
    ats_score: atsResult.score,
    ats_breakdown: JSON.stringify(atsResult.breakdown),
    iterations: JSON.stringify(atsResult.iterations),
    ...(jobMatch ? {
      job_match_score: jobMatch.overall,
      job_match_breakdown: JSON.stringify(jobMatch.breakdown),
    } : {}),
  })
}

export function spawnRevise(applicationId: number, slug: string, feedback: string, updateProfile = false): void {
  const projectDir = process.env.PROJECT_ROOT ?? process.cwd()
  const reviseMd = fs.readFileSync(
    path.join(projectDir, '.claude/commands/revise.md'),
    'utf-8'
  )
  const prompt = reviseMd
    .replace(/\{SLUG\}/g, slug)
    .replace(/\{APP_ID\}/g, String(applicationId))
    .replace(/\{FEEDBACK_JSON\}/g, JSON.stringify(feedback))
    .replace(/\{FEEDBACK\}/g, feedback)
    .replace(/\{UPDATE_PROFILE\}/g, updateProfile ? 'true' : 'false')

  spawnClaude(applicationId, prompt)
}

/**
 * Spawn the claude CLI inside a detached bash pipeline that streams JSON
 * events through a transformer and appends readable text straight to the log
 * file. Nothing in the data path lives in the Next.js server process, so
 * output keeps flowing (and the exit marker still gets written) even if the
 * dev server hot-reloads and orphans the pipeline.
 *
 * `claude -p` (text mode) buffers all output until exit, so stream-json is
 * required for live progress.
 */
function spawnClaude(applicationId: number, prompt: string): void {
  const projectDir = projectRoot()
  const p = logPath(applicationId)
  fs.mkdirSync(path.dirname(p), { recursive: true })
  fs.appendFileSync(p, `[PIPELINE_START: ${new Date().toISOString()}]\n`)

  const transform = path.join(projectDir, 'portal', 'lib', 'stream-transform.mjs')
  // PIPESTATUS[0] = claude's exit code (not the transformer's). bash required.
  const script =
    'claude --dangerously-skip-permissions --output-format stream-json --verbose --model claude-sonnet-4-6 ' +
    '-p "$CLAUDE_PROMPT" < /dev/null 2>&1 | node "$CLAUDE_TRANSFORM" >> "$CLAUDE_LOG"\n' +
    'echo "" >> "$CLAUDE_LOG"\n' +
    'echo "[PIPELINE_EXIT:${PIPESTATUS[0]}]" >> "$CLAUDE_LOG"\n'

  const child = spawn('bash', ['-c', script], {
    cwd: projectDir,
    detached: true,
    stdio: 'ignore',
    env: {
      ...process.env,
      CLAUDE_PROMPT: prompt,
      CLAUDE_LOG: p,
      CLAUDE_TRANSFORM: transform,
    },
  })

  if (child.pid) updateApplication(applicationId, { pid: child.pid })

  child.on('close', () => {
    updateApplication(applicationId, { pid: null })
    finalizeIfComplete(applicationId)
  })

  child.unref()
}

export function spawnPipeline(applicationId: number, jdInput: string, webResearch = false, skipAnalysis = false): void {
  const projectDir = projectRoot()
  const applyMd = fs.readFileSync(
    path.join(projectDir, '.claude/commands/apply.md'),
    'utf-8'
  )
  const prompt = applyMd
    .replace(/\$ARGUMENTS/g, jdInput)
    .replace(/\$WEB_RESEARCH/g, webResearch ? 'enabled' : 'disabled')
    .replace(/\$SKIP_ANALYSIS/g, skipAnalysis ? 'true' : 'false')
    .replace(/\$APP_ID/g, String(applicationId))

  spawnClaude(applicationId, prompt)
}
