import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import { Breadcrumb } from '@/components/Breadcrumb'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Jobz',
  description: 'Job application tracker',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-[#0f0f0f] text-slate-100 min-h-screen`}>
        <div className="flex min-h-screen">
          {/* Sidebar */}
          <aside className="w-14 bg-[#141414] border-r border-[#1e1e1e] flex flex-col items-center py-4 fixed h-full z-10">
            {/* Logo */}
            <Link href="/" className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white text-sm hover:bg-blue-500 transition-colors mb-6">
              J
            </Link>

            {/* Nav */}
            <nav className="flex flex-col items-center gap-1">
              <Link
                href="/"
                title="Board"
                className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-700 transition-colors"
              >
                {/* Grid/kanban icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="1" y="1" width="5" height="7" rx="1" fill="currentColor" opacity="0.8"/>
                  <rect x="1" y="10" width="5" height="5" rx="1" fill="currentColor" opacity="0.5"/>
                  <rect x="8" y="1" width="7" height="5" rx="1" fill="currentColor" opacity="0.5"/>
                  <rect x="8" y="8" width="7" height="7" rx="1" fill="currentColor" opacity="0.8"/>
                </svg>
              </Link>
            </nav>
          </aside>

          {/* Main */}
          <main className="ml-14 flex-1 p-6 overflow-x-hidden">
            <Breadcrumb />
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
