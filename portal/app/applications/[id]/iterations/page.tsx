// app/applications/[id]/iterations/page.tsx
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getApplication } from '@/lib/db'
import { readIterationHistory, PipelineRun, IterationSnapshot } from '@/lib/pipeline'

function scoreColor(score: number | null): string {
  if (score === null) return 'bg-slate-700 text-slate-400'
  if (score >= 80) return 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
  if (score >= 60) return 'bg-amber-900/60 text-amber-300 border border-amber-700'
  return 'bg-red-900/60 text-red-300 border border-red-700'
}

function ScoreBadge({ score }: { score: number | null }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${scoreColor(score)}`}>
      {score !== null ? `${score}/100` : '—'}
    </span>
  )
}

function RunTypeBadge({ type }: { type: 'apply' | 'revise' }) {
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        type === 'apply'
          ? 'bg-blue-900/60 text-blue-300 border border-blue-700'
          : 'bg-purple-900/60 text-purple-300 border border-purple-700'
      }`}
    >
      {type === 'apply' ? 'Apply' : 'Revise'}
    </span>
  )
}

interface IterationRowProps {
  iteration: IterationSnapshot
  appId: number
  slug: string
  runNumber: number
  runType: 'apply' | 'revise'
}

function IterationRow({ iteration, appId, slug, runNumber, runType }: IterationRowProps) {
  const basePath = `/applications/${appId}-${slug}/iterations/run-${runNumber}-${runType}/v${iteration.version}`
  const dateStr = iteration.timestamp
    ? new Date(iteration.timestamp).toLocaleDateString()
    : null

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-mono font-bold text-slate-300 w-6">
          v{iteration.version}
        </span>
        <ScoreBadge score={iteration.score} />

        <div className="flex gap-1.5 flex-wrap">
          {iteration.hasPdf && (
            <a
              href={`${basePath}/cv.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded hover:bg-blue-800/70 border border-blue-800"
            >
              PDF
            </a>
          )}
          {iteration.hasCvTex && (
            <a
              href={`${basePath}/cv.tex`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded hover:bg-slate-600 border border-slate-600"
            >
              CV.tex
            </a>
          )}
          {iteration.hasCoverLetterTex && (
            <a
              href={`${basePath}/cover_letter.tex`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded hover:bg-slate-600 border border-slate-600"
            >
              CL.tex
            </a>
          )}
        </div>

        {dateStr && (
          <span className="text-xs text-slate-500 ml-auto">{dateStr}</span>
        )}
      </div>

      {iteration.gaps.length > 0 && (
        <div className="mt-2 pl-9">
          <div className="text-xs text-slate-600 mb-1">Gaps</div>
          <div className="flex flex-wrap gap-1.5">
            {iteration.gaps.map((gap, i) => (
              <span
                key={i}
                className="text-xs bg-red-900/30 border border-red-800/50 text-red-400 px-2 py-0.5 rounded-full"
              >
                {gap}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

interface RunSectionProps {
  run: PipelineRun
  appId: number
  slug: string
}

function RunSection({ run, appId, slug }: RunSectionProps) {
  return (
    <div className="bg-[#141414] border border-slate-800 rounded-lg p-4">
      {/* Run header */}
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-sm font-bold text-slate-200">
          Run {run.runNumber} — {run.type === 'apply' ? 'Apply' : 'Revise'}
        </h2>
        <RunTypeBadge type={run.type} />
      </div>

      {/* Feedback callout for revise runs */}
      {run.type === 'revise' && run.feedback && (
        <blockquote className="border-l-2 border-purple-700 pl-3 mb-4 text-xs text-slate-400 leading-relaxed italic bg-purple-900/10 py-2 pr-3 rounded-r-md">
          {run.feedback.trim()}
        </blockquote>
      )}

      {/* Iterations */}
      {run.iterations.length === 0 ? (
        <p className="text-xs text-slate-600">No iterations recorded.</p>
      ) : (
        <div className="space-y-2">
          {run.iterations.map((iter) => (
            <IterationRow
              key={iter.version}
              iteration={iter}
              appId={appId}
              slug={slug}
              runNumber={run.runNumber}
              runType={run.type}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default async function IterationsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) notFound()

  const runs = readIterationHistory(app.id, app.slug)

  return (
    <div>
      {/* Back navigation */}
      <div className="mb-5">
        <Link
          href={`/applications/${id}`}
          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          ← Back to {app.role} at {app.company}
        </Link>
      </div>

      {/* Page heading */}
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-lg font-black text-slate-100">Iteration History</h1>
          <p className="text-sm text-slate-400">
            {app.role} at {app.company}
          </p>
        </div>
      </div>

      {/* Runs */}
      {runs.length === 0 ? (
        <div className="bg-[#141414] border border-slate-800 rounded-lg p-6 text-center text-slate-500 text-sm">
          No iteration history found for this application.
        </div>
      ) : (
        <div className="space-y-4">
          {runs.map((run) => (
            <RunSection
              key={`${run.runNumber}-${run.type}`}
              run={run}
              appId={app.id}
              slug={app.slug}
            />
          ))}
        </div>
      )}
    </div>
  )
}
