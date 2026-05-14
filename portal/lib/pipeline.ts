// lib/pipeline.ts
import { spawn } from 'child_process'
import fs from 'fs'
import path from 'path'
import { appendLog, updateApplication } from './db'

export interface PipelineStep {
  name: string
  status: 'pending' | 'in_progress' | 'done'
  detail?: string
}

export interface AtsBreakdown {
  keyword: number
  quantified: number
  sections: number
  formatting: number
  actionVerbs: number
}

export interface AtsResult {
  score: number
  breakdown: AtsBreakdown
  iterations: number[]
}

export const STALE_THRESHOLD_MS = 15 * 60 * 1000

export type StalledState = 'running' | 'stalled' | 'crashed'

export function getStalledState(app: { status: string; log: string; updated_at: string }): StalledState | null {
  if (app.status !== 'generating') return null
  const exitMatch = app.log.match(/\[PIPELINE_EXIT:(\d+)\]/)
  if (exitMatch && exitMatch[1] !== '0') return 'crashed'
  const updatedAt = new Date(app.updated_at.replace(' ', 'T') + 'Z').getTime()
  if (Date.now() - updatedAt > STALE_THRESHOLD_MS) return 'stalled'
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
  if (done('_brief.md')) {
    steps[0].status = 'done'
    steps[1].status = 'in_progress'
  }

  // Step 2: Writer
  if (done('Writer Agent') && steps[0].status === 'done') steps[1].status = 'in_progress'
  if (done('_cv.tex') && done('_cover_letter.tex')) {
    steps[1].status = 'done'
    steps[2].status = 'in_progress'
  }

  // Step 3: ATS
  if (done('ATS Check') && steps[1].status === 'done') steps[2].status = 'in_progress'
  const iterMatch = log.match(/Iteration (\d+)/)
  if (iterMatch && steps[2].status === 'in_progress') {
    steps[2].detail = `iteration ${iterMatch[1]} of 3`
  }
  if (done('tectonic')) {
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

  const historyMatch = log.match(/Score history:\s*\[([^\]]+)\]/)
  const iterations = historyMatch
    ? historyMatch[1].split(/\s*→\s*/).map(Number)
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


export function spawnPipeline(applicationId: number, jdInput: string, webResearch = false, skipAnalysis = false): void {
  const projectDir = process.env.PROJECT_ROOT ?? process.cwd()
  const applyMd = fs.readFileSync(
    path.join(projectDir, '.claude/commands/apply.md'),
    'utf-8'
  )
  const prompt = applyMd
    .replace(/\$ARGUMENTS/g, jdInput)
    .replace(/\$WEB_RESEARCH/g, webResearch ? 'enabled' : 'disabled')
    .replace(/\$SKIP_ANALYSIS/g, skipAnalysis ? 'true' : 'false')

  const child = spawn(
    'claude',
    ['--dangerously-skip-permissions', '-p', prompt],
    {
      cwd: projectDir,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  )

  const write = (chunk: Buffer) => appendLog(applicationId, chunk.toString())
  child.stdout.on('data', write)
  child.stderr.on('data', write)

  child.on('close', (code) => {
    appendLog(applicationId, `\n[PIPELINE_EXIT:${code}]\n`)
  })

  child.unref()
}
