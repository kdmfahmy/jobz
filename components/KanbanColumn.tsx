// components/KanbanColumn.tsx
import { Application, ApplicationStatus } from '@/lib/db'
import { ApplicationCard } from './ApplicationCard'

const COLUMN_LABELS: Record<ApplicationStatus, string> = {
  generating: 'Generating',
  generated:  'Generated',
  applied:    'Applied',
  interview:  'Interview',
  offer:      'Offer',
  rejected:   'Rejected',
}

const COLUMN_ACCENT: Record<ApplicationStatus, string> = {
  generating: 'text-blue-400',
  generated:  'text-slate-300',
  applied:    'text-violet-400',
  interview:  'text-amber-400',
  offer:      'text-emerald-400',
  rejected:   'text-red-400',
}

export function KanbanColumn({ status, apps }: { status: ApplicationStatus; apps: Application[] }) {
  return (
    <div className="flex-1 min-w-[180px] bg-[#141414] rounded-lg p-3">
      <div className="flex items-center gap-1.5 mb-3">
        <span className={`text-xs font-semibold uppercase tracking-wide ${COLUMN_ACCENT[status]}`}>
          {COLUMN_LABELS[status]}
        </span>
        <span className="text-xs text-slate-600">{apps.length}</span>
      </div>
      {apps.map(app => (
        <ApplicationCard key={app.id} app={app} />
      ))}
    </div>
  )
}
