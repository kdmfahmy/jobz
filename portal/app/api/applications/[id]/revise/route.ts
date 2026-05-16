import { NextRequest, NextResponse } from 'next/server'
import { getApplication, updateApplication } from '@/lib/db'
import { spawnRevise, appendPipelineLog } from '@/lib/pipeline'

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app.status !== 'generated') return NextResponse.json({ error: 'Can only revise a generated application' }, { status: 409 })

  const body = await req.json()
  const feedback = (body.feedback ?? '').trim()
  if (!feedback) return NextResponse.json({ error: 'Feedback is required' }, { status: 400 })
  const updateProfile = body.updateProfile === true

  appendPipelineLog(app.id, `\n[REVISE REQUEST]\n${feedback}\n[/REVISE REQUEST]\n`)
  updateApplication(app.id, { status: 'generating' })
  spawnRevise(app.id, app.slug, feedback, updateProfile)

  return NextResponse.json({ ok: true })
}
