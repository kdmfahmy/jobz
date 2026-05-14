// app/applications/[id]/progress/page.tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineProgress } from '@/components/PipelineProgress'
import { PipelineStep } from '@/lib/pipeline'

interface StatusResponse {
  id: number
  status: 'generating' | 'generated' | 'applied' | 'interview' | 'offer' | 'rejected'
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
  const logRef = useRef<HTMLDivElement>(null)

  // Resolve params (Promise in Next.js 15+)
  useEffect(() => {
    let cancelled = false
    params.then(p => { if (!cancelled) setId(p.id) })
    return () => { cancelled = true }
  }, [params])

  // Fetch basic app info once id is resolved
  useEffect(() => {
    if (!id) return
    fetch(`/api/applications/${id}`)
      .then(r => r.json())
      .then(data => setAppInfo({ company: data.company, role: data.role }))
      .catch(() => {})
  }, [id])

  // Auto-scroll log tail to bottom on update
  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [statusData?.logTail])

  // Poll status every 2 seconds
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
      } catch {}
    }

    poll()
    intervalId = setInterval(poll, 2000)
    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [id, router])

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        {appInfo ? (
          <>
            <h1 className="text-xl font-bold text-slate-100">{appInfo.role}</h1>
            <p className="text-sm text-slate-500 mt-0.5">{appInfo.company}</p>
          </>
        ) : (
          <div className="h-6 bg-slate-800 rounded w-48 animate-pulse" />
        )}
        <div className="flex items-center gap-2 mt-3">
          <span className="inline-block w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          <span className="text-sm text-amber-400 font-medium">Generating...</span>
        </div>
      </div>

      {statusData ? (
        <>
          <PipelineProgress
            steps={statusData.steps}
            currentAtsScore={statusData.currentAtsScore}
            missingKeywords={statusData.missingKeywords}
          />
          {statusData.logTail && (
            <div className="mt-6">
              <div className="text-xs text-slate-500 uppercase tracking-wide mb-2">Live Output</div>
              <div
                ref={logRef}
                className="bg-black/40 border border-slate-800 rounded-lg p-3 h-40 overflow-y-auto"
              >
                <pre className="font-mono text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">{statusData.logTail}</pre>
              </div>
            </div>
          )}
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
