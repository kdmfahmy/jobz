'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function ReviseForm({ id }: { id: number }) {
  const router = useRouter()
  const [feedback, setFeedback] = useState('')
  const [updateProfile, setUpdateProfile] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRevise() {
    if (!feedback.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/applications/${id}/revise`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, updateProfile }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to start revision')
      }
      router.push(`/applications/${id}/progress`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#141414] border border-slate-800 rounded-lg p-4 mb-5">
      <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Revise</div>
      <textarea
        value={feedback}
        onChange={e => setFeedback(e.target.value)}
        placeholder="e.g. The summary is too generic, tone down the leadership emphasis, remove the Odoo R&D bullet, write the cover letter..."
        rows={3}
        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none mb-3"
      />
      <label className="flex items-center gap-2 mb-3 cursor-pointer">
        <input
          type="checkbox"
          checked={updateProfile}
          onChange={e => setUpdateProfile(e.target.checked)}
          className="w-3.5 h-3.5 rounded border-slate-600 bg-slate-800 accent-blue-500"
        />
        <span className="text-xs text-slate-400">Also update my base profile with any factual corrections</span>
      </label>
      <div className="flex items-center gap-3">
        <button
          onClick={handleRevise}
          disabled={loading || !feedback.trim()}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          {loading ? (
            <><span className="animate-spin inline-block">⟳</span> Starting revision…</>
          ) : (
            '↺ Revise'
          )}
        </button>
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  )
}
