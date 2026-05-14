'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function RestartButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleRestart() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/applications/${id}/restart`, { method: 'POST' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error ?? 'Failed to restart')
      }
      router.push(`/applications/${id}/progress`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        onClick={handleRestart}
        disabled={loading}
        className="bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
      >
        {loading ? (
          <><span className="animate-spin inline-block">⟳</span> Restarting…</>
        ) : (
          '↺ Restart Pipeline'
        )}
      </button>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
