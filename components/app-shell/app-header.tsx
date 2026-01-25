'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { HeaderActions } from './header-actions'
import { PAGE_GUTTER } from '@/lib/layout-constants'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface AppHeaderProps {
  /**
   * Whether to show the sidebar trigger (for dashboard pages)
   * @default false
   */
  showSidebarTrigger?: boolean
  /**
   * Whether the header should be sticky
   * @default true
   */
  sticky?: boolean
  /**
   * Whether to show navigation links (for marketing pages)
   * @default false
   */
  showNavigation?: boolean
}

const EXAMPLE_PROFILE_ADDRESS = '0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1'

const navigationItems = [
  { label: 'Overview', href: '/', exact: true },
  { label: 'Example Profile', href: `/p/${EXAMPLE_PROFILE_ADDRESS}` },
  { label: 'Docs', href: 'https://docs.soci4l.com', external: true },
]

/**
 * AppHeader - Reusable header component for both landing and dashboard pages
 * 
 * Features:
 * - SOCI4L logo on the left
 * - Optional center navigation (for marketing pages)
 * - HeaderActions (Connect Wallet / Avatar dropdown) on the right
 * - Optional sidebar trigger for dashboard pages
 * - Sticky positioning support
 */
export function AppHeader({ showSidebarTrigger = false, sticky = true, showNavigation = false }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()

  const viewExampleProfile = () => {
    router.push(`/p/${EXAMPLE_PROFILE_ADDRESS}`)
  }

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href
    }
    return pathname?.startsWith(href)
  }

  return (
    <header 
      className={cn(
        'flex h-16 min-h-[4rem] items-center gap-4 border-b border-border/60 bg-background/95',
        PAGE_GUTTER,
        sticky && 'sticky top-0 z-50',
        'backdrop-blur-sm transition-all ease-linear shadow-sm'
      )}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <Link 
          href="/" 
          className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
        >
          <Soci4LLogo variant="combination" className="h-7 w-auto transition-transform group-hover:scale-105" />
        </Link>
      </div>

      {/* Center: Navigation (optional, for marketing pages) */}
      {showNavigation && (
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          {navigationItems.map((item) => {
            const active = !item.external && isActive(item.href, item.exact)
            
            if (item.external) {
              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  asChild
                  className={cn(
                    'text-sm font-medium transition-colors',
                    'hover:bg-accent hover:text-accent-foreground',
                    'h-9 px-4'
                  )}
                >
                  <a
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {item.label}
                  </a>
                </Button>
              )
            }

            return (
              <Button
                key={item.href}
                variant="ghost"
                size="sm"
                onClick={() => router.push(item.href)}
                className={cn(
                  'text-sm font-medium transition-colors',
                  'hover:bg-accent hover:text-accent-foreground',
                  'h-9 px-4',
                  active && 'bg-accent text-accent-foreground'
                )}
              >
                {item.label}
              </Button>
            )
          })}
        </nav>
      )}

      {/* Right: Header Actions (Connect Wallet / Avatar Dropdown) */}
      <div className="flex flex-1 items-center justify-end gap-2 shrink-0">
        <HeaderActions />
      </div>
    </header>
  )
}
