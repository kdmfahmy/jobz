// app/applications/[id]/progress/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PipelineProgress } from '@/components/PipelineProgress'
import { PipelineStep } from '@/lib/pipeline'

interface StatusResponse {
  id: number
  status: string
  steps: PipelineStep[]
  currentAtsScore: number | null
  missingKeywords: string[]
}

export default function ProgressPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [id, setId] = useState<string | null>(null)
  const [statusData, setStatusData] = useState<StatusResponse | null>(null)
  const [appInfo, setAppInfo] = useState<{ company: string; role: string } | null>(null)

  // Resolve params (Promise in Next.js 15+)
  useEffect(() => {
    params.then(p => setId(p.id))
  }, [params])

  // Fetch basic app info once id is resolved
  useEffect(() => {
    if (!id) return
    fetch(`/api/applications/${id}`)
      .then(r => r.json())
      .then(data => setAppInfo({ company: data.company, role: data.role }))
      .catch(() => {})
  }, [id])

  // Poll status every 2 seconds
  useEffect(() => {
    if (!id) return
    const poll = async () => {
      try {
        const res = await fetch(`/api/applications/${id}/status`)
        if (!res.ok) return
        const data: StatusResponse = await res.json()
        setStatusData(data)
        if (data.status === 'generated') {
          router.push(`/applications/${id}`)
        }
      } catch {}
    }

    poll()
    const interval = setInterval(poll, 2000)
    return () => clearInterval(interval)
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
        <PipelineProgress
          steps={statusData.steps}
          currentAtsScore={statusData.currentAtsScore}
          missingKeywords={statusData.missingKeywords}
        />
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
