'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Crumb {
  label: string
  href?: string
}

export function Breadcrumb() {
  const pathname = usePathname()
  const [crumbs, setCrumbs] = useState<Crumb[]>([])

  useEffect(() => {
    const parts = pathname.split('/').filter(Boolean)

    // /
    if (parts.length === 0) {
      setCrumbs([])
      return
    }

    // /new
    if (parts[0] === 'new') {
      setCrumbs([
        { label: 'Board', href: '/' },
        { label: 'New Application' },
      ])
      return
    }

    // /applications/:id[/progress]
    if (parts[0] === 'applications' && parts[1]) {
      const id = parts[1]
      const isProgress = parts[2] === 'progress'

      fetch(`/api/applications/${id}`)
        .then(r => r.ok ? r.json() : null)
        .then(app => {
          if (!app) return
          const appLabel = `${app.company} — ${app.role}`
          if (isProgress) {
            setCrumbs([
              { label: 'Board', href: '/' },
              { label: appLabel, href: `/applications/${id}` },
              { label: 'Progress' },
            ])
          } else {
            setCrumbs([
              { label: 'Board', href: '/' },
              { label: appLabel },
            ])
          }
        })
        .catch(() => {})
      return
    }

    setCrumbs([{ label: 'Board', href: '/' }])
  }, [pathname])

  if (crumbs.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-5">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <span className="text-slate-700">/</span>}
          {crumb.href ? (
            <Link href={crumb.href} className="hover:text-slate-300 transition-colors">
              {crumb.label}
            </Link>
          ) : (
            <span className="text-slate-400">{crumb.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
