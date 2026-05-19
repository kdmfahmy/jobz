import { NextRequest, NextResponse } from 'next/server'
import { getApplication, updateApplication } from '@/lib/db'
import { spawnRevise } from '@/lib/pipeline'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app.status !== 'generated') return NextResponse.json({ error: 'Can only revise a generated application' }, { status: 409 })

  const body = await req.json()
  const feedback = (body.feedback ?? '').trim()
  if (!feedback) return NextResponse.json({ error: 'Feedback is required' }, { status: 400 })
  const updateProfile = body.updateProfile === true

  // The [REVISE REQUEST] history marker is written by revise.md Phase 0 (single
  // source of truth — so CLI-triggered revises record history identically, and
  // portal-triggered ones don't double-record). We still flip status here for
  // instant UI feedback; revise.md Phase 0 sets it again, idempotently.
  updateApplication(app.id, { status: 'generating' })
  spawnRevise(app.id, app.slug, feedback, updateProfile)

  return NextResponse.json({ ok: true })
}
