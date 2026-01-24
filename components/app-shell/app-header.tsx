'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
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

  const viewExampleProfile = () => {
    router.push(`/p/${EXAMPLE_PROFILE_ADDRESS}`)
  }

  return (
    <header 
      className={cn(
        'flex h-14 min-h-[3.5rem] items-center gap-2 border-b border-border bg-background/80',
        PAGE_GUTTER,
        sticky && 'sticky top-0 z-50',
        'backdrop-blur transition-[width] ease-linear'
      )}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Soci4LLogo variant="combination" className="h-6 w-auto" />
        </Link>
      </div>

      {/* Center: Navigation (optional, for marketing pages) */}
      {showNavigation && (
        <nav className="hidden md:flex flex-1 items-center justify-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/')}
            className="text-xs"
          >
            Overview
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={viewExampleProfile}
            className="text-xs"
          >
            Example Profile
          </Button>
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-xs"
          >
            <Link href="#" onClick={(e) => e.preventDefault()}>
              Docs
            </Link>
          </Button>
        </nav>
      )}

      {/* Right: Header Actions (Connect Wallet / Avatar Dropdown) */}
      <div className="flex flex-1 items-center justify-end gap-2 shrink-0">
        <HeaderActions />
      </div>
    </header>
  )
}
