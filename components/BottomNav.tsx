'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'

function LibraryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0 1 11.186 0Z" />
    </svg>
  )
}

function WishlistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
    </svg>
  )
}

function CaptureIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
    </svg>
  )
}

function SurpriseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
    </svg>
  )
}

function WatchlistIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.375 19.5h17.25m-17.25 0a1.125 1.125 0 0 1-1.125-1.125M3.375 19.5h1.5C5.496 19.5 6 18.996 6 18.375m-3.75.125-.125-14.25A1.125 1.125 0 0 1 3.375 3h17.25a1.125 1.125 0 0 1 1.125 1.125V18.375c0 .621-.504 1.125-1.125 1.125m-17.25 0h17.25M12 9.75 9.75 12 12 14.25l2.25-2.25L12 9.75Z" />
    </svg>
  )
}

const NAV_ITEMS = [
  { href: '/library',   label: 'Library',   Icon: LibraryIcon   },
  { href: '/wishlist',  label: 'Wishlist',  Icon: WishlistIcon  },
  { href: '/capture',   label: 'Capture',   Icon: CaptureIcon,  primary: true },
  { href: '/watchlist', label: 'Watchlist', Icon: WatchlistIcon },
  { href: '/browse',    label: 'Surprise',  Icon: SurpriseIcon  },
]

export function BottomNav() {
  const { user, loading } = useAuth()
  const pathname = usePathname()

  if (loading || !user) return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-10 pb-safe">
      <div className="max-w-2xl mx-auto px-2 h-16 flex items-center justify-around">
        {NAV_ITEMS.map(({ href, label, Icon, primary }) => {
          const active = pathname === href

          if (primary) {
            return (
              <Link key={href} href={href} className="flex flex-col items-center gap-1 -mt-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shadow-md transition-colors ${active ? 'bg-violet-700' : 'bg-violet-600 hover:bg-violet-700'}`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-[10px] font-medium ${active ? 'text-violet-600' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            )
          }

          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${active ? 'text-violet-600' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
