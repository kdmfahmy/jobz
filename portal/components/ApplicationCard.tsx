// components/ApplicationCard.tsx
import Link from 'next/link'
import { Application } from '@/lib/db'
import { getStalledState } from '@/lib/pipeline'

function scoreBadgeColor(score: number | null, type: 'ats' | 'match') {
  if (score === null) return 'bg-slate-700 text-slate-400'
  if (type === 'ats') {
    if (score >= 80) return 'bg-blue-900 text-blue-300'
    if (score >= 60) return 'bg-amber-900 text-amber-300'
    return 'bg-red-900 text-red-300'
  }
  if (score >= 80) return 'bg-emerald-900 text-emerald-300'
  if (score >= 60) return 'bg-amber-900 text-amber-300'
  return 'bg-red-900 text-red-300'
}

export function ApplicationCard({ app }: { app: Application }) {
  const stalledState = getStalledState(app)

  return (
    <Link href={`/applications/${app.id}`}>
      <div className="bg-slate-800 border border-slate-700 rounded-md p-3 mb-2 hover:border-blue-500 transition-colors cursor-pointer">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 bg-slate-600 rounded flex items-center justify-center text-xs font-bold text-slate-300 flex-shrink-0">
            {(app.company[0] ?? '?').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold text-slate-100 truncate">{app.role}</div>
            <div className="text-xs text-slate-400 truncate">{app.company}</div>
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {app.status === 'pending' ? (
            <span className="text-xs bg-slate-700 text-slate-400 px-1.5 py-0.5 rounded">
              Ready to generate
            </span>
          ) : app.status === 'generating' ? (
            <>
              <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded animate-pulse">
                Generating...
              </span>
              {stalledState === 'stalled' && (
                <span className="text-xs bg-amber-900 text-amber-300 px-1.5 py-0.5 rounded">
                  Stalled
                </span>
              )}
              {stalledState === 'crashed' && (
                <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">
                  Crashed
                </span>
              )}
            </>
          ) : (
            <>
              <span className={`text-xs px-1.5 py-0.5 rounded ${scoreBadgeColor(app.ats_score, 'ats')}`}>
                ATS {app.ats_score ?? '—'}%
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${scoreBadgeColor(app.job_match_score, 'match')}`}>
                Match {app.job_match_score ?? '—'}%
              </span>
            </>
          )}
        </div>
      </div>
    </Link>
  )
}
