// app/api/applications/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getApplication, updateApplication } from '@/lib/db'
import { parsePipelineSteps, parseAtsResult, parseCurrentAtsScore, parseMissingKeywords } from '@/lib/pipeline'
import { scoreJobMatch } from '@/lib/jobmatch'

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const steps = parsePipelineSteps(app.log)
  const currentAtsScore = parseCurrentAtsScore(app.log)
  const missingKeywords = parseMissingKeywords(app.log)

  // Detect completion and finalize scores if not yet done
  if (app.status === 'generating' && app.log.includes('APPLICATION:')) {
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
      }
    }
  }

  const freshApp = getApplication(Number(id))

  return NextResponse.json({
    id: freshApp!.id,
    status: freshApp!.status,
    steps,
    currentAtsScore,
    missingKeywords,
  })
}
