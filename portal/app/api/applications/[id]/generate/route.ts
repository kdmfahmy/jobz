// app/api/applications/[id]/generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { getApplication, updateApplication } from '@/lib/db'
import { spawnPipeline } from '@/lib/pipeline'

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app.status === 'generating') return NextResponse.json({ error: 'Already generating' }, { status: 409 })

  const projectDir = process.env.PROJECT_ROOT ?? path.resolve(process.cwd(), '..')
  const briefPath = path.join(projectDir, 'applications', `${app.id}-${app.slug}`, 'brief.md')
  const briefExists = fs.existsSync(briefPath)

  // Prefer pre-extracted text so the analyzer doesn't re-fetch the URL.
  // Prepend company/role so the analyzer picks them up from the first lines.
  const jdInput = app.jd_text
    ? `Company: ${app.company}\nRole: ${app.role}\n\n${app.jd_text}`
    : (app.jd_url ?? '')

  updateApplication(app.id, { status: 'generating' })
  spawnPipeline(app.id, jdInput, false, briefExists)

  return NextResponse.json({ ok: true })
}
