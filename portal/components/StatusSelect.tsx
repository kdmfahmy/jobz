'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_OPTIONS = ['generated', 'applied', 'interview', 'offer', 'rejected'] as const

export function StatusSelect({ id, current }: { id: number; current: string }) {
  const [value, setValue] = useState(current)
  const router = useRouter()

  async function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value
    setValue(next)
    await fetch(`/api/applications/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    })
    router.refresh()
  }

  return (
    <select
      value={value}
      onChange={handleChange}
      className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
    >
      {STATUS_OPTIONS.map(s => (
        <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
      ))}
    </select>
  )
}
