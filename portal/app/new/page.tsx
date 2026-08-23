// app/new/page.tsx
'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'

export default function NewApplicationPage() {
  const router = useRouter()
  const [jdUrl, setJdUrl] = useState('')
  const [jobId, setJobId] = useState('')
  const [jdText, setJdText] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [webResearch, setWebResearch] = useState(false)
  const [jdHeight, setJdHeight] = useState(200)
  const jdRef = useRef<HTMLTextAreaElement>(null)

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    const startY = e.clientY
    const startH = jdRef.current?.offsetHeight ?? jdHeight
    const onMove = (ev: MouseEvent) => setJdHeight(Math.max(80, startH + ev.clientY - startY))
    const onUp = () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [jdHeight])
  const [fetching, setFetching] = useState(false)
  const [fetchError, setFetchError] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleUrlBlur() {
    const url = jdUrl.trim()
    if (!url) return
    setFetching(true)
    setFetchError('')
    try {
      const res = await fetch(`/api/fetch-jd?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Failed to fetch')
      if (data.role && !role) setRole(data.role)
      if (data.company && !company) setCompany(data.company)
      if (data.job_id && !jobId) setJobId(data.job_id)
      if (data.jd_text && !jdText) setJdText(data.jd_text)
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Could not fetch URL')
    } finally {
      setFetching(false)
    }
  }

  // Auto-extract from pasted JD text when no URL provided
  function handleJdChange(text: string) {
    setJdText(text)
    if (!jdUrl) {
      const titleMatch = text.match(/^(.+?)\s*\n/)
      if (titleMatch && !role) setRole(titleMatch[1].trim().slice(0, 80))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!jdText.trim() && !jdUrl.trim()) {
      setError('Provide a job URL or paste the job description.')
      return
    }
    if (!company.trim() || !role.trim()) {
      setError('Company and role are required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company, role, jd_text: jdText, jd_url: jdUrl || undefined, job_id: jobId || undefined, web_research: webResearch }),
      })
      if (!res.ok) {
        let errMsg = 'Failed to create application'
        try {
          const data = await res.json()
          if (data.error) errMsg = data.error
        } catch {}
        throw new Error(errMsg)
      }
      const app = await res.json()
      router.push(`/applications/${app.id}`)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-100">New Application</h1>
        <p className="text-sm text-slate-500 mt-1">Paste a job description or drop a URL — we&apos;ll do the rest.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* URL */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Job URL <span className="text-slate-600 font-normal normal-case">(optional)</span>
          </label>
          <input
            type="url"
            value={jdUrl}
            onChange={e => setJdUrl(e.target.value)}
            onBlur={handleUrlBlur}
            placeholder="https://jobs.apple.com/en-us/details/..."
            className="w-full bg-[#141414] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
          {fetching && (
            <p className="text-xs text-slate-500 mt-1 animate-pulse">Fetching…</p>
          )}
          {!fetching && fetchError && (
            <p className="text-xs text-amber-500 mt-1">{fetchError} — fill in company and role manually.</p>
          )}
          {!fetching && !fetchError && (
            <p className="text-xs text-slate-600 mt-1">Company, role, and JD will be auto-filled when you leave this field.</p>
          )}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600">OR PASTE JD BELOW</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* Job Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Job Title <span className="text-slate-600 font-normal normal-case">(auto-filled)</span>
          </label>
          <input
            value={role}
            onChange={e => setRole(e.target.value)}
            placeholder="Senior Software Engineer"
            className="w-full bg-[#141414] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Job ID */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Job ID <span className="text-slate-600 font-normal normal-case">(auto-filled)</span>
          </label>
          <input
            value={jobId}
            onChange={e => setJobId(e.target.value)}
            placeholder="e.g. 7461884697410799112"
            className="w-full bg-[#141414] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Company */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Company <span className="text-slate-600 font-normal normal-case">(auto-filled)</span>
          </label>
          <input
            value={company}
            onChange={e => setCompany(e.target.value)}
            placeholder="Apple"
            className="w-full bg-[#141414] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* JD textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Job Description
          </label>
          <textarea
            ref={jdRef}
            value={jdText}
            onChange={e => handleJdChange(e.target.value)}
            placeholder="Paste the full job description here — title, responsibilities, requirements..."
            style={{ height: jdHeight }}
            className="block w-full bg-[#141414] border border-slate-700 rounded-t-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
          />
          <div
            onMouseDown={handleDragStart}
            className="w-full h-3 bg-slate-800 border border-t-0 border-slate-700 rounded-b-lg flex items-center justify-center cursor-ns-resize select-none hover:bg-slate-700 transition-colors"
          >
            <div className="w-8 h-0.5 bg-slate-600 rounded-full" />
          </div>
        </div>

        {/* Web research toggle */}
        <div className="flex items-center justify-between rounded-lg border border-slate-700 bg-[#141414] px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-300">Web research</p>
            <p className="text-xs text-slate-500 mt-0.5">Analyzer will search for company info and benchmark the role — adds ~1 min</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={webResearch}
            onClick={() => setWebResearch(v => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${webResearch ? 'bg-blue-600' : 'bg-slate-700'}`}
          >
            <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${webResearch ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading || fetching}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">&#x27F3;</span> Starting...
              </>
            ) : (
              'Add Application'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
