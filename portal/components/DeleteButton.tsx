'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export function DeleteButton({ id }: { id: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleDelete() {
    if (!confirm('Delete this application? This cannot be undone.')) return
    setLoading(true)
    await fetch(`/api/applications/${id}`, { method: 'DELETE' })
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleDelete}
      disabled={loading}
      className="bg-red-900/40 hover:bg-red-900/70 disabled:opacity-50 text-red-400 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
    >
      {loading ? 'Deleting…' : 'Delete'}
    </button>
  )
}
