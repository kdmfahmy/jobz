// components/ScoreCard.tsx
import { AtsBreakdown } from '@/lib/pipeline'

interface ScoreCardProps {
  score: number
  breakdown: AtsBreakdown
  iterations: number[]
}

export function ScoreCard({ score, breakdown, iterations }: ScoreCardProps) {
  const pass = score >= 80
  return (
    <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4">
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">ATS Score</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-3xl font-black text-blue-400">{score}</span>
        <span className="text-sm text-slate-500">/100</span>
        <span className={`ml-2 text-xs px-1.5 py-0.5 rounded ${pass ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>
          {pass ? 'PASS' : 'BELOW TARGET'}
        </span>
      </div>
      <div className="bg-slate-800 rounded h-1.5 mb-3 overflow-hidden">
        <div className="bg-blue-500 h-full rounded" style={{ width: `${score}%` }} />
      </div>
      <div className="space-y-1.5">
        {[
          ['Keyword Match',           `${breakdown.keyword}/35`],
          ['Quantified Achievements', `${breakdown.quantified}/25`],
          ['Section Completeness',    `${breakdown.sections}/20`],
          ['Formatting',              `${breakdown.formatting}/12`],
          ['Action Verbs',            `${breakdown.actionVerbs}/8`],
        ].map(([label, val]) => (
          <div key={label} className="flex justify-between text-xs">
            <span className="text-slate-400">{label}</span>
            <span className="text-slate-200">{val}</span>
          </div>
        ))}
      </div>
      {iterations.length > 1 && (
        <div className="mt-3 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-500 mb-1">Iterations</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {iterations.map((s, i) => (
              <span key={i} className={`text-xs px-1.5 py-0.5 rounded ${i === iterations.length - 1 ? 'bg-slate-700 text-blue-300' : 'bg-slate-800 text-amber-400'}`}>
                {s}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
