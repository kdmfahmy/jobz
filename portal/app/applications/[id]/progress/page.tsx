'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { PipelineProgress } from '@/components/PipelineProgress'
import { PipelineStep, StalledState } from '@/lib/pipeline'

interface StatusResponse {
  id: number
  status: 'generating' | 'generated' | 'applied' | 'interview' | 'offer' | 'rejected'
  stalledState: StalledState | null
  steps: PipelineStep[]
  currentAtsScore: number | null
  missingKeywords: string[]
  logTail: string
}

export default function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [statusData, setStatusData] = useState<StatusResponse | null>(null)
  const [appInfo, setAppInfo] = useState<{ company: string; role: string } | null>(null)
  const logRef = useRef<HTMLPreElement>(null)
  const [logExpanded, setLogExpanded] = useState(false)
  const [userScrolled, setUserScrolled] = useState(false)

  useEffect(() => {
    let cancelled = false
    params.then(p => { if (!cancelled) setId(p.id) })
    return () => { cancelled = true }
  }, [params])

  useEffect(() => {
    if (!id) return
    fetch(`/api/applications/${id}`)
      .then(r => r.json())
      .then(data => setAppInfo({ company: data.company, role: data.role }))
      .catch(() => {})
  }, [id])

  // Auto-scroll to bottom unless user has scrolled up
  useEffect(() => {
    if (!userScrolled && logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight
    }
  }, [statusData?.logTail, userScrolled])

  useEffect(() => {
    if (!id) return
    let cancelled = false
    let intervalId: ReturnType<typeof setInterval>

    const poll = async () => {
      try {
        const res = await fetch(`/api/applications/${id}/status`)
        if (!res.ok) return
        const data: StatusResponse = await res.json()
        if (cancelled) return
        setStatusData(data)
        if (data.status === 'generated') {
          clearInterval(intervalId)
          router.push(`/applications/${id}`)
        }
        if (data.stalledState === 'crashed') {
          clearInterval(intervalId)
        }
      } catch {}
    }

    poll()
    intervalId = setInterval(poll, 2000)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [id, router])

  const crashed = statusData?.stalledState === 'crashed'

  return (
    <div>
      {id && (
        <Link href={`/applications/${id}`} className="text-slate-600 hover:text-slate-400 transition-colors block mb-4 text-base leading-none">
          ←
        </Link>
      )}
      <div className="mb-6">
        {appInfo ? (
          <>
            <h1 className="text-xl font-bold text-slate-100">{appInfo.role}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{appInfo.company}</p>
          </>
        ) : (
          <div className="h-6 bg-slate-800 rounded w-48 animate-pulse" />
        )}
        <div className="flex items-center mt-3">
          {crashed ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-red-500 rounded-full" />
              <span className="text-sm text-red-400 font-medium">Pipeline crashed</span>
            </div>
          ) : !statusData || statusData.logTail.trim() === '' ? (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-slate-500 rounded-full animate-pulse" />
              <span className="text-sm text-slate-400 font-medium">Queued — waiting for agent to start…</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              <span className="text-sm text-amber-400 font-medium">Generating...</span>
            </div>
          )}
        </div>
      </div>

      {crashed && (
        <div className="bg-red-950/40 border border-red-800 rounded-lg p-4 mb-5 text-sm text-red-300">
          The pipeline exited with an error. Check the log below for details, then use the <strong>Restart</strong> button on the application page.
        </div>
      )}

      {statusData ? (
        <>
          <PipelineProgress
            steps={statusData.steps}
            currentAtsScore={statusData.currentAtsScore}
            missingKeywords={statusData.missingKeywords}
          />

          {/* Live log panel */}
          <div className="mt-6">
            <button
              onClick={() => setLogExpanded(v => !v)}
              className="w-full flex items-center justify-between px-4 sm:px-6 py-3 bg-slate-900 border border-slate-800 hover:bg-slate-800/60 transition-colors group"
              style={{ borderRadius: logExpanded ? '8px 8px 0 0' : '8px' }}
            >
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-500">$</span>
                <span className="text-sm font-medium text-slate-300">Details</span>
                {statusData.logTail && !logExpanded && (
                  <span className="text-xs text-slate-600 font-mono truncate max-w-[200px]">
                    {statusData.logTail.trim().split('\n').filter(Boolean).at(-1)?.slice(0, 60)}
                  </span>
                )}
              </div>
              <svg
                className="text-slate-500 transition-transform flex-shrink-0"
                style={{ width: '16px', height: '16px', transform: logExpanded ? 'rotate(180deg)' : undefined }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {logExpanded && (
              <div className="border border-t-0 border-slate-800 rounded-b-lg overflow-hidden relative">
                <pre
                  ref={logRef}
                  onScroll={e => {
                    const el = e.currentTarget
                    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40
                    setUserScrolled(!atBottom)
                  }}
                  className="font-mono text-xs text-slate-400 leading-relaxed bg-[#0d0d0d] p-4"
                  style={{ height: '480px', whiteSpace: 'pre-wrap', overflowY: 'auto' }}
                >
                  {statusData.logTail || '(waiting for output…)'}
                </pre>
                {userScrolled && (
                  <button
                    onClick={() => {
                      setUserScrolled(false)
                      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
                    }}
                    className="absolute bottom-4 right-6 text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-full border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    ↓ Jump to bottom
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex gap-4">
              <div className="w-7 h-7 bg-slate-800 rounded-full animate-pulse flex-shrink-0" />
              <div className="flex-1 pt-1">
                <div className="h-3 bg-slate-800 rounded w-32 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
