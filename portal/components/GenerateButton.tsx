'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function GenerateButton({
  id,
  defaultCoverLetter = false,
  defaultWebResearch = false,
}: {
  id: number
  defaultCoverLetter?: boolean
  defaultWebResearch?: boolean
}) {
  const router = useRouter()
  const [coverLetter, setCoverLetter] = useState(defaultCoverLetter)
  const [webResearch, setWebResearch] = useState(defaultWebResearch)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleGenerate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/applications/${id}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cover_letter: coverLetter, web_research: webResearch }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to start generation')
      }
      router.push(`/applications/${id}/progress`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={coverLetter}
          onChange={e => setCoverLetter(e.target.checked)}
          disabled={loading}
          className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 accent-blue-500"
        />
        <span className="text-xs text-slate-400">Cover letter</span>
      </label>
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={webResearch}
          onChange={e => setWebResearch(e.target.checked)}
          disabled={loading}
          className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 accent-blue-500"
        />
        <span className="text-xs text-slate-400">Web research</span>
      </label>
      <div>
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          {loading ? (
            <><span className="animate-spin inline-block">⟳</span> Starting…</>
          ) : (
            coverLetter ? '✦ Generate CV & Cover Letter' : '✦ Generate CV'
          )}
        </button>
        {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
      </div>
    </div>
  )
}
