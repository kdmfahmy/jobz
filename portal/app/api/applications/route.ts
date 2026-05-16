// app/api/applications/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createApplication, listApplications } from '@/lib/db'

export async function GET() {
  const apps = listApplications()
  return NextResponse.json(apps)
}

export async function POST(req: NextRequest) {
  let body: { company: string; role: string; jd_text: string; jd_url?: string; web_research?: boolean }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (!body.jd_text?.trim()) {
    return NextResponse.json({ error: 'jd_text is required' }, { status: 400 })
  }
  if (!body.company?.trim() || !body.role?.trim()) {
    return NextResponse.json({ error: 'company and role are required' }, { status: 400 })
  }

  const slugPart = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const slug = `${slugPart(body.company)}_${slugPart(body.role)}`

  try {
    const app = createApplication({
      slug,
      company: body.company,
      role: body.role,
      jd_url: body.jd_url,
      jd_text: body.jd_text,
    })
    return NextResponse.json(app, { status: 201 })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Failed to create application'
    const isDupe = msg.includes('UNIQUE')
    return NextResponse.json(
      { error: isDupe ? 'An application for this company and role already exists.' : msg },
      { status: isDupe ? 409 : 500 }
    )
  }
}
