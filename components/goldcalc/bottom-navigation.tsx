'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Banknote, TrendingUp, Newspaper } from 'lucide-react'
import type { Dispatch, SetStateAction } from 'react'
import type { Page } from './sidebar-navigation'

export interface BottomNavigationProps {
  /** Optional: overrides path-based active detection (used by / SPA only) */
  page?: Page | string
  /** Accepted so existing callers don't break, but Link handles actual navigation */
  setPage?: ((p: Page) => void) | ((p: string) => void) | Dispatch<SetStateAction<Page>>
}

const items = [
  { href: '/', label: 'HOME', icon: Home, matchExact: true },
  { href: '/gold', label: 'GOLD', icon: Banknote, matchExact: false },
  { href: '/pivot', label: 'PIVOT', icon: TrendingUp, matchExact: false },
  { href: '/news', label: 'NEWS', icon: Newspaper, matchExact: false },
]

interface BottomNavigationProps {
  page?: string
  setPage?: (page: string) => void
}

export function BottomNavigation({ page }: BottomNavigationProps) {
  const pathname = usePathname()
  const currentPath = page ? `/${page}` : pathname

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md">
      {items.map((item) => {
        const isActive = item.matchExact
          ? currentPath === item.href || (item.href === '/' && currentPath === '/home')
          : currentPath.startsWith(item.href)
        const Icon = item.icon

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 transition-colors ${
              isActive ? 'text-[#0292e3]' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon className={`h-5 w-5 ${isActive ? 'text-[#0292e3]' : 'text-slate-400'}`} />
            <span className={`text-[11px] font-bold tracking-wider ${isActive ? 'text-[#0292e3]' : 'text-slate-400'}`}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
