// app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApplication, listApplications } from '@/lib/db'
import { spawnPipeline } from '@/lib/pipeline'

export async function GET() {
  const apps = listApplications()
  return NextResponse.json(apps)
}

export async function POST(req: NextRequest) {
  const body = await req.json() as {
    company: string
    role: string
    jd_text: string
    jd_url?: string
  }

  if (!body.jd_text?.trim()) {
    return NextResponse.json({ error: 'jd_text is required' }, { status: 400 })
  }
  if (!body.company?.trim() || !body.role?.trim()) {
    return NextResponse.json({ error: 'company and role are required' }, { status: 400 })
  }

  const slug = `${body.company}_${body.role}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const app = createApplication({
    slug,
    company: body.company,
    role: body.role,
    jd_url: body.jd_url,
    jd_text: body.jd_text,
  })

  // Fire-and-forget — pipeline runs in background
  spawnPipeline(app.id, body.jd_url ?? body.jd_text)

  return NextResponse.json(app, { status: 201 })
}
