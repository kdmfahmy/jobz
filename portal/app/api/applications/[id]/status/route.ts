// app/api/applications/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getApplication, updateApplication } from '@/lib/db'
import { parsePipelineSteps, parseAtsResult, parseCurrentAtsScore, parseMissingKeywords, parseMatchedKeywords, getStalledState, getCurrentRunLog, readPipelineLog } from '@/lib/pipeline'
import { scoreJobMatch } from '@/lib/jobmatch'

const scoringInFlight = new Set<number>()

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const currentRunLog = getCurrentRunLog(readPipelineLog(app.id))
  const steps = parsePipelineSteps(currentRunLog)
  const currentAtsScore = parseCurrentAtsScore(currentRunLog)
  const missingKeywords = parseMissingKeywords(currentRunLog)
  const matchedKeywords = parseMatchedKeywords(currentRunLog)
  const logLines = currentRunLog.split('\n').filter(l => l.trim())
  const logTail = logLines.slice(-200).join('\n')

  // Detect completion and finalize scores if not yet done
  if (app.status === 'generating' && currentRunLog.includes('APPLICATION:') && !scoringInFlight.has(app.id)) {
    scoringInFlight.add(app.id)
    const atsResult = parseAtsResult(currentRunLog)
    if (atsResult) {
      try {
        const jobMatch = scoreJobMatch(app.id, app.slug)
        updateApplication(app.id, {
          status: 'generated',
          ats_score: atsResult.score,
          ats_breakdown: JSON.stringify(atsResult.breakdown),
          iterations: JSON.stringify(atsResult.iterations),
          job_match_score: jobMatch.overall,
          job_match_breakdown: JSON.stringify(jobMatch.breakdown),
        })
      } catch {
        // Job match scoring failed — still mark as generated with just ATS
        updateApplication(app.id, {
          status: 'generated',
          ats_score: atsResult.score,
          ats_breakdown: JSON.stringify(atsResult.breakdown),
          iterations: JSON.stringify(atsResult.iterations),
        })
      } finally {
        scoringInFlight.delete(app.id)
      }
    } else {
      scoringInFlight.delete(app.id)
    }
  }

  const freshApp = getApplication(Number(id))!
  const stalledState = getStalledState(freshApp)

  return NextResponse.json({
    id: freshApp.id,
    status: freshApp.status,
    stalledState,
    steps,
    currentAtsScore,
    missingKeywords,
    matchedKeywords,
    logTail,
  })
}
