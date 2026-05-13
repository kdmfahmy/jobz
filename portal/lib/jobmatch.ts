// lib/jobmatch.ts
import { execFileSync } from 'child_process'
import fs from 'fs'
import path from 'path'

export interface SkillBreakdown {
  score: number
  matched: string[]
  gaps: string[]
}

export interface TextBreakdown {
  score: number
  notes: string
}

export interface JobMatchBreakdown {
  skills: SkillBreakdown
  experience: TextBreakdown
  education: TextBreakdown
  domain: TextBreakdown
}

export interface JobMatchResult {
  overall: number
  breakdown: JobMatchBreakdown
}

export function parseJobMatchResponse(output: string): JobMatchResult {
  // Try code block first
  const codeBlock = output.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
  if (codeBlock) return JSON.parse(codeBlock[1])

  // Try raw JSON
  const rawJson = output.match(/(\{[\s\S]*\})/)
  if (rawJson) return JSON.parse(rawJson[1])

  throw new Error(`Could not parse job match JSON from output: ${output.slice(0, 200)}`)
}

export function scoreJobMatch(slug: string): JobMatchResult {
  const projectDir = process.env.PROJECT_ROOT ?? process.cwd()

  const profile = fs.readFileSync(
    path.join(projectDir, 'profile/base_profile.md'),
    'utf-8'
  )
  const brief = fs.readFileSync(
    path.join(projectDir, `output/${slug}_brief.md`),
    'utf-8'
  )
  const template = fs.readFileSync(
    path.join(projectDir, 'prompts/jobmatch.md'),
    'utf-8'
  )

  const prompt = template
    .replace('{PROFILE}', profile)
    .replace('{BRIEF}', brief)

  const output = execFileSync(
    'claude',
    ['-p', prompt],
    { cwd: projectDir, encoding: 'utf-8', timeout: 60_000 }
  )

  return parseJobMatchResponse(output)
}
