// components/PipelineProgress.tsx
import { PipelineStep } from '@/lib/pipeline'

export function PipelineProgress({
  steps,
  currentAtsScore,
  missingKeywords,
}: {
  steps: PipelineStep[]
  currentAtsScore: number | null
  missingKeywords: string[]
}) {
  return (
    <div className="space-y-0">
      {steps.map((step, i) => (
        <div key={step.name} className="flex gap-4 items-start pb-5">
          {/* Icon + connector */}
          <div className="flex flex-col items-center flex-shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold
              ${step.status === 'done' ? 'bg-emerald-900 text-emerald-300' :
                step.status === 'in_progress' ? 'bg-blue-900 text-blue-300' :
                'bg-slate-800 border border-slate-700 text-slate-500'}`}>
              {step.status === 'done' ? '✓' : i + 1}
            </div>
            {i < steps.length - 1 && (
              <div className="w-0.5 flex-1 bg-slate-800 min-h-[16px] mt-1" />
            )}
          </div>
          {/* Content */}
          <div className="pt-0.5">
            <div className={`text-sm font-semibold
              ${step.status === 'done' ? 'text-emerald-400' :
                step.status === 'in_progress' ? 'text-blue-400' : 'text-slate-500'}`}>
              {step.name}
              {step.detail && (
                <span className="ml-2 text-xs font-normal text-slate-500">{step.detail}</span>
              )}
            </div>
            {step.status === 'in_progress' && (
              <div className="mt-1.5 w-32 bg-slate-800 rounded h-0.5 overflow-hidden">
                <div className="bg-blue-500 h-full rounded w-1/2 animate-pulse" />
              </div>
            )}
          </div>
        </div>
      ))}

      {/* ATS preview during check */}
      {currentAtsScore !== null && (
        <div className="bg-[#141414] border border-slate-800 rounded-lg p-3 flex gap-4 items-center mt-2">
          <div className="text-center">
            <div className="text-xs text-slate-500 mb-1">ATS so far</div>
            <div className={`text-xl font-black ${currentAtsScore >= 80 ? 'text-blue-400' : 'text-amber-400'}`}>
              {currentAtsScore}
            </div>
          </div>
          {missingKeywords.length > 0 && (
            <>
              <div className="w-px h-8 bg-slate-800" />
              <div className="text-xs text-slate-400">
                <span className="text-red-400">Missing: </span>
                {missingKeywords.slice(0, 5).join(', ')}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
