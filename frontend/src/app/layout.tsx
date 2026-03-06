import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'URL Indexer Dashboard',
  description: 'Submit and monitor URL indexing via Google and IndexNow',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <nav className="bg-white border-b border-gray-200 shadow-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-14 items-center gap-6">
              <span className="font-semibold text-gray-800 text-sm tracking-tight">
                URL Indexer
              </span>
              <div className="flex items-center gap-1">
                <Link
                  href="/"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600
                             hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Submit
                </Link>
                <Link
                  href="/dashboard"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600
                             hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  Dashboard
                </Link>
                <Link
                  href="/history"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-gray-600
                             hover:bg-gray-100 hover:text-gray-900 transition-colors"
                >
                  History
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
