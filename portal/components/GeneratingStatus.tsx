'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RestartButton } from './RestartButton'
import { StalledState } from '@/lib/pipeline'

interface Props {
  id: number
  initialStalledState: StalledState | null
}

export function GeneratingStatus({ id, initialStalledState }: Props) {
  const router = useRouter()
  const [stalledState, setStalledState] = useState<StalledState | null>(initialStalledState)

  useEffect(() => {
    let cancelled = false
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/applications/${id}/status`)
        if (!res.ok || cancelled) return
        const data = await res.json()
        if (cancelled) return
        if (data.status === 'generated') {
          clearInterval(interval)
          router.refresh()
          return
        }
        setStalledState(data.stalledState)
        if (data.stalledState === 'crashed' || data.stalledState === 'stalled') {
          clearInterval(interval)
        }
      } catch {}
    }, 3000)
    return () => { cancelled = true; clearInterval(interval) }
  }, [id, router])

  if (stalledState === 'stalled') {
    return (
      <div className="flex-1 bg-[#141414] border border-amber-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-amber-400">Pipeline stalled</div>
          <div className="text-xs text-slate-500 mt-0.5">No activity detected</div>
        </div>
        <div className="flex gap-2 items-center">
          <a href={`/applications/${id}/progress`} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            View Log
          </a>
          <RestartButton id={id} />
        </div>
      </div>
    )
  }

  if (stalledState === 'crashed') {
    return (
      <div className="flex-1 bg-[#141414] border border-red-800 rounded-lg p-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-red-400">Pipeline failed</div>
          <div className="text-xs text-slate-500 mt-0.5">No activity detected</div>
        </div>
        <div className="flex gap-2 items-center">
          <a href={`/applications/${id}/progress`} className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">
            View Log
          </a>
          <RestartButton id={id} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4 flex items-center justify-between">
      <div className="text-slate-500 text-sm animate-pulse">Pipeline running...</div>
      <a
        href={`/applications/${id}/progress`}
        className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
      >
        View Progress
      </a>
    </div>
  )
}
