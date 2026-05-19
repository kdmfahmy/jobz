// components/ScoreCard.tsx
import { AtsBreakdown } from '@/lib/pipeline'

interface ScoreCardProps {
  score: number
  breakdown: AtsBreakdown
  iterations: number[]
}

function SubBar({ title, score, max, note }: { title: string; score: number; max: number; note?: string }) {
  const pct = Math.round((score / max) * 100)
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-slate-400">{title}</span>
        <span className="text-slate-200">{score}/{max}</span>
      </div>
      <div className="bg-slate-800 rounded h-1 mb-1 overflow-hidden">
        <div
          className={`h-full rounded ${pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {note && (
        <div className="text-xs mb-1">
          {note.split(/\s*·\s*|\.\s+(?=[A-Z])/).map((part, i) => (
            <span key={i}>
              {i > 0 && <span className="text-slate-600"> · </span>}
              <span className={part.toLowerCase().startsWith('missing') || part.toLowerCase().startsWith('weak') || part.toLowerCase().startsWith('unquantified') ? 'text-red-400' : 'text-emerald-600'}>
                {part}
              </span>
            </span>
          ))}
        </div>
      )}
    </div>
  )
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
      <div className="bg-slate-800 rounded h-1.5 mb-4 overflow-hidden">
        <div className="bg-blue-500 h-full rounded" style={{ width: `${score}%` }} />
      </div>
      <div className="space-y-2.5">
        <SubBar title="Keyword Match"           score={breakdown.keyword}    max={35} note={breakdown.keywordNote} />
        <SubBar title="Quantified Achievements" score={breakdown.quantified}  max={25} note={breakdown.quantifiedNote} />
        <SubBar title="Section Completeness"    score={breakdown.sections}   max={20} note={breakdown.sectionsNote} />
        <SubBar title="Formatting"              score={breakdown.formatting} max={12} note={breakdown.formattingNote} />
        <SubBar title="Action Verbs"            score={breakdown.actionVerbs} max={8} note={breakdown.actionVerbsNote} />
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
