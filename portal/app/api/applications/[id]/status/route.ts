// app/api/applications/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getApplication, updateApplication } from '@/lib/db'
import { parsePipelineSteps, parseAtsResult, parseCurrentAtsScore, parseMissingKeywords, parseMatchedKeywords } from '@/lib/pipeline'
import { scoreJobMatch } from '@/lib/jobmatch'

const scoringInFlight = new Set<number>()

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const steps = parsePipelineSteps(app.log)
  const currentAtsScore = parseCurrentAtsScore(app.log)
  const missingKeywords = parseMissingKeywords(app.log)
  const matchedKeywords = parseMatchedKeywords(app.log)
  const logLines = app.log.split('\n').filter(l => l.trim())
  const logTail = logLines.slice(-20).join('\n')

  // Detect completion and finalize scores if not yet done
  if (app.status === 'generating' && app.log.includes('APPLICATION:') && !scoringInFlight.has(app.id)) {
    scoringInFlight.add(app.id)
    const atsResult = parseAtsResult(app.log)
    if (atsResult) {
      try {
        const jobMatch = scoreJobMatch(app.slug)
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

  // Detect pipeline failure — prevent stuck 'generating' status
  const exitMatch = app.log.match(/\[PIPELINE_EXIT:(\d+)\]/)
  if (app.status === 'generating' && exitMatch && exitMatch[1] !== '0') {
    updateApplication(app.id, { status: 'generated' })
  }

  // Don't finalize pending apps — the Analyzer pre-run exit is not a pipeline completion
  if (app.status === 'pending' && exitMatch) {
    // Do nothing — pre-run completed, app stays pending until user clicks Generate
  }

  const freshApp = getApplication(Number(id))

  return NextResponse.json({
    id: freshApp!.id,
    status: freshApp!.status,
    steps,
    currentAtsScore,
    missingKeywords,
    matchedKeywords,
    logTail,
  })
}
