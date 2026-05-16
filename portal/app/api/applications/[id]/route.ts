// app/api/applications/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getApplication, updateApplication, deleteApplication, ApplicationStatus } from '@/lib/db'

const VALID_STATUSES: ApplicationStatus[] = [
  'generating', 'generated', 'applied', 'interview', 'offer', 'rejected',
]

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(app)
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const app = getApplication(Number(id))
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Kill the entire process group so orphaned children (claude, node) also die
  if (app.pid) {
    try { process.kill(-app.pid, 'SIGTERM') } catch { /* already gone */ }
  }

  deleteApplication(Number(id))
  return new NextResponse(null, { status: 204 })
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await req.json() as { status?: ApplicationStatus }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const updated = updateApplication(Number(id), body)
  if (!updated) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(updated)
}
