// app/page.tsx
import Link from 'next/link'
import { listApplications, ApplicationStatus } from '@/lib/db'
import { KanbanColumn } from '@/components/KanbanColumn'

const COLUMNS: ApplicationStatus[] = [
  'generating', 'generated', 'applied', 'interview', 'offer', 'rejected',
]

export default function BoardPage() {
  const apps = listApplications()
  const byStatus = Object.fromEntries(
    COLUMNS.map(s => [s, apps.filter(a => a.status === s)])
  ) as Record<ApplicationStatus, typeof apps>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-100">Applications</h1>
          <p className="text-sm text-slate-500 mt-0.5">{apps.length} total</p>
        </div>
        <Link
          href="/new"
          className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Application
        </Link>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.filter(s => s !== 'rejected' || byStatus.rejected.length > 0)
          .map(status => (
            <KanbanColumn key={status} status={status} apps={byStatus[status]} />
          ))}
      </div>
    </div>
  )
}
