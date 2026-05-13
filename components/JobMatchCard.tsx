// components/JobMatchCard.tsx
import { JobMatchBreakdown } from '@/lib/jobmatch'

interface JobMatchCardProps {
  score: number
  breakdown: JobMatchBreakdown
}

function label(score: number) {
  if (score >= 80) return { text: 'STRONG', cls: 'bg-emerald-900 text-emerald-300' }
  if (score >= 60) return { text: 'MODERATE', cls: 'bg-amber-900 text-amber-300' }
  return { text: 'WEAK', cls: 'bg-red-900 text-red-300' }
}

function SubBar({ title, score, children }: { title: string; score: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{title}</span>
        <span className="text-slate-200">{score}%</span>
      </div>
      <div className="bg-slate-800 rounded h-1 mb-1.5 overflow-hidden">
        <div
          className={`h-full rounded ${score >= 80 ? 'bg-emerald-500' : score >= 60 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="text-xs text-slate-500">{children}</div>
    </div>
  )
}

export function JobMatchCard({ score, breakdown }: JobMatchCardProps) {
  const { text, cls } = label(score)
  return (
    <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4">
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Job Match</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-black text-emerald-400">{score}</span>
        <span className="text-sm text-slate-500">%</span>
        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${cls}`}>{text}</span>
      </div>
      <div className="bg-slate-800 rounded h-1.5 mb-4 overflow-hidden">
        <div className="bg-emerald-500 h-full rounded" style={{ width: `${score}%` }} />
      </div>
      <div className="space-y-3">
        <SubBar title="Skills" score={breakdown.skills.score}>
          <span className="text-emerald-600">{breakdown.skills.matched.slice(0, 4).join(', ')}</span>
          {breakdown.skills.gaps.length > 0 && (
            <> · <span className="text-red-500">missing: {breakdown.skills.gaps.join(', ')}</span></>
          )}
        </SubBar>
        <SubBar title="Experience" score={breakdown.experience.score}>
          {breakdown.experience.notes}
        </SubBar>
        <SubBar title="Education" score={breakdown.education.score}>
          {breakdown.education.notes}
        </SubBar>
        <SubBar title="Domain" score={breakdown.domain.score}>
          {breakdown.domain.notes}
        </SubBar>
      </div>
    </div>
  )
}
