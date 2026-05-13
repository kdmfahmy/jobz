import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
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
          <aside className="w-14 bg-[#141414] border-r border-[#1e1e1e] flex flex-col items-center py-4 gap-4 fixed h-full z-10">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">
              J
            </div>
            <nav className="flex flex-col gap-3 mt-4">
              <Link href="/" className="w-5 h-1 bg-blue-500 rounded" title="Board" />
              <Link href="/new" className="w-5 h-1 bg-slate-700 rounded" title="New Application" />
            </nav>
          </aside>
          {/* Main */}
          <main className="ml-14 flex-1 p-6">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
