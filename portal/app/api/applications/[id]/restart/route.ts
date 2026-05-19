import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getApplication, updateApplication } from '@/lib/db'
import { spawnPipeline, appendPipelineLog, getStalledState } from '@/lib/pipeline'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app.status !== 'generating') return NextResponse.json({ error: 'Not in generating state' }, { status: 409 })

  const state = getStalledState(app)
  if (state === 'running') {
    return NextResponse.json(
      { error: 'Run is still active — refusing to restart (would duplicate execution)' },
      { status: 409 }
    )
  }

  // Kill any existing process before spawning a new one
  if (app.pid) {
    try { process.kill(app.pid, 'SIGTERM') } catch {}
  }

  const projectDir = process.env.PROJECT_ROOT ?? path.resolve(process.cwd(), '..')
  const briefPath = path.join(projectDir, 'applications', `${app.id}-${app.slug}`, 'brief.md')
  const briefExists = fs.existsSync(briefPath)

  appendPipelineLog(app.id, `\n[RESTART: ${new Date().toISOString()}]\n`)
  updateApplication(app.id, { status: 'generating', pid: null })
  spawnPipeline(app.id, app.jd_text || (app.jd_url ?? ''), false, briefExists)

  return NextResponse.json({ ok: true })
}
