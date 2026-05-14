import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getApplication, updateApplication, appendLog } from '@/lib/db'
import { spawnPipeline, getStalledState } from '@/lib/pipeline'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (!getStalledState(app)) return NextResponse.json({ error: 'Not stalled or crashed' }, { status: 409 })

  const projectDir = process.env.PROJECT_ROOT ?? path.resolve(process.cwd(), '..')
  const briefPath = path.join(projectDir, 'output', `${app.slug}_brief.md`)
  const briefExists = fs.existsSync(briefPath)

  appendLog(app.id, `\n[RESTART: ${new Date().toISOString()}]\n`)
  updateApplication(app.id, { status: 'generating' })
  spawnPipeline(app.id, app.jd_url ?? app.jd_text, false, briefExists)

  return NextResponse.json({ ok: true })
}
