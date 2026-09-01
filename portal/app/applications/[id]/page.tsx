// app/applications/[id]/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import fs from 'fs'
import path from 'path'
import { getApplication } from '@/lib/db'
import { ScoreCard } from '@/components/ScoreCard'
import { JobMatchCard } from '@/components/JobMatchCard'
import { DeleteButton } from '@/components/DeleteButton'
import { GenerateButton } from '@/components/GenerateButton'
import { ReviseForm } from '@/components/ReviseForm'
import { StatusSelect } from '@/components/StatusSelect'
import { GeneratingStatus } from '@/components/GeneratingStatus'
import { AtsBreakdown, JobMatchBreakdown, getStalledState, parseKeywordsFromBrief, parseMissingKeywords, parseMatchedKeywords, parseRevisionHistory, readPipelineLog, readIterationHistory } from '@/lib/pipeline'

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) notFound()

  const stalledState = getStalledState(app)

  const projectDir = process.env.PROJECT_ROOT ?? path.resolve(process.cwd(), '..')
  const briefPath = path.join(projectDir, 'applications', `${id}-${app.slug}`, 'brief.md')
  const briefText = fs.existsSync(briefPath) ? fs.readFileSync(briefPath, 'utf-8') : null
  const hasCoverLetter = fs.existsSync(
    path.join(projectDir, 'applications', `${id}-${app.slug}`, 'cover_letter.tex')
  )
  const keywordGroups = briefText ? parseKeywordsFromBrief(briefText) : []
  const pipelineLog = readPipelineLog(app.id)
  const matchedKeywords = parseMatchedKeywords(pipelineLog)
  const missingKeywords = parseMissingKeywords(pipelineLog)
  const revisionHistory = parseRevisionHistory(pipelineLog)
  const iterationHistory = readIterationHistory(app.id, app.slug)
  const hasIterations = iterationHistory.length > 0

  let atsBreakdown: AtsBreakdown | null = null
  let jobMatchBreakdown: JobMatchBreakdown | null = null
  let iterations: number[] = []
  try {
    if (app.ats_breakdown) atsBreakdown = JSON.parse(app.ats_breakdown)
    if (app.job_match_breakdown) jobMatchBreakdown = JSON.parse(app.job_match_breakdown)
    if (app.iterations) iterations = JSON.parse(app.iterations)
  } catch {}

  return (
    <div>
      {/* Actions */}
      <div className="flex items-center justify-end mb-5">
        <div className="flex gap-2 items-center">
          {app.status !== 'generating' && (
            <StatusSelect id={app.id} current={app.status} />
          )}
          {app.status === 'pending' && (
            <GenerateButton
              id={app.id}
              defaultCoverLetter={app.cover_letter === 1}
              defaultWebResearch={app.web_research === 1}
            />
          )}
          {hasIterations && (
            <Link
              href={`/applications/${id}/iterations`}
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Iterations
            </Link>
          )}
          {app.ats_score !== null && (
            <a
              href={`/applications/${id}-${app.slug}/cv.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Open CV PDF
            </a>
          )}
          <DeleteButton id={app.id} />
        </div>
      </div>

      {/* Job identity */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-lg font-black text-slate-400 flex-shrink-0">
          {(app.company[0] ?? '?').toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-100">{app.role}</h1>
          <p className="text-sm text-slate-400">{app.company}</p>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {app.jd_url && (
              <a href={app.jd_url} target="_blank" rel="noopener noreferrer" className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded hover:text-blue-400">
                🔗 Job URL
              </a>
            )}
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded">
              📅 {new Date(app.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Scores row */}
      {app.status === 'pending' ? (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4 text-center text-slate-500 text-sm">
            Hit <span className="text-slate-300 font-semibold">Generate</span> to start the pipeline. Tick <span className="text-slate-300 font-semibold">Cover letter</span> first if you want one.
          </div>
        </div>
      ) : app.status === 'generating' ? (
        <div className="flex gap-3 mb-5">
          <GeneratingStatus id={app.id} initialStalledState={stalledState} />
        </div>
      ) : (
        <div className="flex gap-3 mb-5">
          {atsBreakdown && app.ats_score !== null ? (
            <ScoreCard score={app.ats_score} breakdown={atsBreakdown} iterations={iterations} />
          ) : (
            <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4 text-slate-500 text-sm">No ATS score yet</div>
          )}
          {jobMatchBreakdown && app.job_match_score !== null ? (
            <JobMatchCard score={app.job_match_score} breakdown={jobMatchBreakdown} />
          ) : (
            <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4 text-slate-500 text-sm">No job match score yet</div>
          )}
          {/* Documents */}
          <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Documents</div>
            <div className="flex flex-col gap-2">
              {[['CV', 'cv'], ...(hasCoverLetter ? [['Cover Letter', 'cover_letter']] : [])].map(([label, file]) => (
                <div key={file} className="bg-slate-800 rounded-lg flex items-center justify-between" style={{ padding: '10px 14px' }}>
                  <span className="text-sm font-semibold text-slate-200">{label}</span>
                  <div className="flex gap-1.5">
                    <a
                      href={`/applications/${id}-${app.slug}/${file}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-900 text-blue-300 text-xs px-2 py-1 rounded hover:bg-blue-800"
                    >
                      PDF
                    </a>
                    <a
                      href={`/applications/${id}-${app.slug}/${file}.tex`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-700 text-slate-400 text-xs px-2 py-1 rounded hover:bg-slate-600"
                    >
                      TEX
                    </a>
                  </div>
                </div>
              ))}
            </div>
            {!hasCoverLetter && (
              <p className="text-xs text-slate-600 mt-2">
                No cover letter — ask for one in the Revise box below.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Revision history — always visible once revisions exist */}
      {revisionHistory.length > 0 && (
        <div className="bg-[#141414] border border-slate-800 rounded-lg p-4 mb-3">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Revision History</div>
          <ol className="space-y-2">
            {revisionHistory.map((entry, i) => (
              <li key={i} className="flex items-center gap-3 text-xs">
                <span className="text-slate-600 flex-shrink-0 w-5 text-right">{i + 1}.</span>
                <span className="bg-slate-800 rounded-md px-3 py-2 text-slate-300 leading-relaxed flex-1">{entry}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Revise form */}
      {app.status === 'generated' && <ReviseForm id={app.id} />}

      {/* Keywords */}
      {keywordGroups.length > 0 && (
        <div className="bg-[#141414] border border-slate-800 rounded-lg p-4 mb-5">
          <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Skills</div>
          <div className="space-y-3">
            {keywordGroups.filter(g => !g.category.toLowerCase().includes('soft skill')).map(group => (
              <div key={group.category}>
                <div className="text-xs text-slate-600 mb-1.5">{group.category}</div>
                <div className="flex flex-wrap gap-1.5">
                  {group.keywords.map(kw => {
                    const lk = kw.toLowerCase()
                    const isMatched = matchedKeywords.some(m => m.toLowerCase() === lk)
                    const isMissing = missingKeywords.some(m => m.toLowerCase() === lk)
                    return (
                      <span
                        key={kw}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          isMatched
                            ? 'bg-emerald-900/50 border-emerald-700 text-emerald-300'
                            : isMissing
                            ? 'bg-red-900/50 border-red-800 text-red-300'
                            : 'bg-slate-800 border-slate-700 text-slate-400'
                        }`}
                      >
                        {kw}
                      </span>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full JD */}
      <div className="bg-[#141414] border border-slate-800 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Full Job Description</div>
        <div className="text-xs text-slate-400 leading-relaxed max-h-96 overflow-y-auto" style={{ whiteSpace: 'pre-wrap' }}>
          {app.jd_text}
        </div>
      </div>
    </div>
  )
}
