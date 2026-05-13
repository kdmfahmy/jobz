// app/applications/[id]/page.tsx
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getApplication } from '@/lib/db'
import { ScoreCard } from '@/components/ScoreCard'
import { JobMatchCard } from '@/components/JobMatchCard'
import { AtsBreakdown } from '@/lib/pipeline'
import { JobMatchBreakdown } from '@/lib/jobmatch'

const STATUS_OPTIONS = ['generated', 'applied', 'interview', 'offer', 'rejected'] as const

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) notFound()

  let atsBreakdown: AtsBreakdown | null = null
  let jobMatchBreakdown: JobMatchBreakdown | null = null
  let iterations: number[] = []
  try {
    if (app.ats_breakdown) atsBreakdown = JSON.parse(app.ats_breakdown)
    if (app.job_match_breakdown) jobMatchBreakdown = JSON.parse(app.job_match_breakdown)
    if (app.iterations) iterations = JSON.parse(app.iterations)
  } catch {}

  async function updateStatus(formData: FormData) {
    'use server'
    const { updateApplication } = await import('@/lib/db')
    const { revalidatePath } = await import('next/cache')
    const status = formData.get('status') as string
    const validStatuses = ['generated', 'applied', 'interview', 'offer', 'rejected'] as const
    if (!validStatuses.includes(status as typeof validStatuses[number])) return
    updateApplication(Number(id), { status: status as typeof validStatuses[number] })
    revalidatePath('/')
    revalidatePath(`/applications/${id}`)
  }

  return (
    <div>
      {/* Back + actions */}
      <div className="flex items-center justify-between mb-5">
        <Link href="/" className="text-xs text-slate-500 hover:text-slate-300 transition-colors">
          ← Back to Board
        </Link>
        <div className="flex gap-2 items-center">
          <form action={updateStatus} className="flex gap-1.5 items-center">
            <select
              name="status"
              defaultValue={app.status}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
            >
              {STATUS_OPTIONS.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <button
              type="submit"
              className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-2.5 py-1.5 rounded-lg transition-colors"
            >
              Update
            </button>
          </form>
          {app.ats_score !== null && (
            <a
              href={`/output/${app.slug}_cv.pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
            >
              Open CV PDF
            </a>
          )}
        </div>
      </div>

      {/* Job identity */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-11 h-11 bg-slate-800 border border-slate-700 rounded-xl flex items-center justify-center text-lg font-black text-slate-400 flex-shrink-0">
          {(app.company[0] ?? '?').toUpperCase()}
        </div>
        <div>
          <h1 className="text-lg font-black text-slate-100">{app.role}</h1>
          <p className="text-sm text-slate-400">{app.company}</p>
          <div className="flex gap-2 mt-1.5 flex-wrap">
            {app.jd_url && (
              <a href={app.jd_url} target="_blank" rel="noopener noreferrer" className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded hover:text-blue-400">
                🔗 Job URL
              </a>
            )}
            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded">
              📅 {new Date(app.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Scores row */}
      {app.status === 'generating' ? (
        <div className="flex gap-3 mb-5">
          <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4 text-center text-slate-500 text-sm animate-pulse">
            Pipeline running...
          </div>
        </div>
      ) : (
        <div className="flex gap-3 mb-5">
          {atsBreakdown && app.ats_score !== null ? (
            <ScoreCard score={app.ats_score} breakdown={atsBreakdown} iterations={iterations} />
          ) : (
            <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4 text-slate-500 text-sm">No ATS score yet</div>
          )}
          {jobMatchBreakdown && app.job_match_score !== null ? (
            <JobMatchCard score={app.job_match_score} breakdown={jobMatchBreakdown} />
          ) : (
            <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4 text-slate-500 text-sm">No job match score yet</div>
          )}
          {/* Documents */}
          <div className="flex-1 bg-[#141414] border border-slate-800 rounded-lg p-4">
            <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Documents</div>
            <div className="space-y-2">
              {[['CV', `${app.slug}_cv`], ['Cover Letter', `${app.slug}_cover_letter`]].map(([label, base]) => (
                <div key={base} className="bg-slate-800 rounded-lg p-2.5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-slate-200">{label}</div>
                    <div className="text-xs text-slate-500">{base}.pdf</div>
                  </div>
                  <div className="flex gap-1.5">
                    <a
                      href={`/output/${base}.pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-blue-900 text-blue-300 text-xs px-2 py-0.5 rounded hover:bg-blue-800"
                    >
                      PDF
                    </a>
                    <a
                      href={`/output/${base}.tex`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-slate-700 text-slate-400 text-xs px-2 py-0.5 rounded hover:bg-slate-600"
                    >
                      TEX
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Full JD */}
      <div className="bg-[#141414] border border-slate-800 rounded-lg p-4">
        <div className="text-xs text-slate-500 uppercase tracking-wide mb-3">Full Job Description</div>
        <div className="text-xs text-slate-400 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap">
          {app.jd_text}
        </div>
      </div>
    </div>
  )
}
