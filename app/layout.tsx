import type { Metadata } from 'next'
import './globals.css'
import Link from 'next/link'
import Image from 'next/image'
import { AuthProvider } from '@/lib/auth-context'
import { NavUser } from '@/components/NavUser'
import { BottomNav } from '@/components/BottomNav'

export const metadata: Metadata = {
  title: 'Stash',
  description: 'Save any article or YouTube video, let AI organize it, then get suggestions based on your mood and available time.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div className="min-h-screen flex flex-col">
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-100">
              <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg tracking-tight">
                  <Image src="/logo.png" alt="Stash" width={40} height={40} className="rounded-md" priority />
                  Stash
                </Link>
                <NavUser />
              </div>
            </header>
            <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 pb-24">
              {children}
            </main>
            <BottomNav />
          </div>
        </AuthProvider>
      </body>
    </html>
  )
}
