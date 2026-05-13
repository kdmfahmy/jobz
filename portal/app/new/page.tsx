// app/new/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewApplicationPage() {
  const router = useRouter()
  const [jdUrl, setJdUrl] = useState('')
  const [jdText, setJdText] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Auto-extract company/role from pasted JD text
  function handleJdChange(text: string) {
    setJdText(text)
    const titleMatch = text.match(/^(.+?)\s*\n/)
    if (titleMatch && !role) setRole(titleMatch[1].trim().slice(0, 80))
    const appleMatch = text.match(/\bApple\b/i)
    if (appleMatch && !company) setCompany('Apple')
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
        body: JSON.stringify({ company, role, jd_text: jdText, jd_url: jdUrl || undefined }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to create application')
      }
      const app = await res.json()
      router.push(`/applications/${app.id}/progress`)
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
            placeholder="https://jobs.apple.com/en-us/details/..."
            className="w-full bg-[#141414] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
          />
          <p className="text-xs text-slate-600 mt-1">If provided, the JD will be fetched automatically.</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-800" />
          <span className="text-xs text-slate-600">OR PASTE JD BELOW</span>
          <div className="flex-1 h-px bg-slate-800" />
        </div>

        {/* JD textarea */}
        <div>
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
            Job Description
          </label>
          <textarea
            value={jdText}
            onChange={e => handleJdChange(e.target.value)}
            placeholder="Paste the full job description here — title, responsibilities, requirements..."
            rows={8}
            className="w-full bg-[#141414] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500 resize-none"
          />
        </div>

        {/* Company + Role */}
        <div className="flex gap-4">
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              Role Title <span className="text-slate-600 font-normal normal-case">(auto-filled)</span>
            </label>
            <input
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Senior Software Engineer"
              className="w-full bg-[#141414] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-900 rounded-lg px-3 py-2">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            {loading ? (
              <>
                <span className="animate-spin inline-block">&#x27F3;</span> Starting...
              </>
            ) : (
              '✦ Generate CV & Cover Letter'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
