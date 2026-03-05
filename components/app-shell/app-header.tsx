'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { useState } from 'react'
import { cn } from '@/lib/utils'
import { PAGE_GUTTER } from '@/lib/layout-constants'
import { Menu } from 'lucide-react'

import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { HeaderActions } from './header-actions'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'


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
  /**
   * Optional class name for the header
   */
  className?: string
}

const EXAMPLE_PROFILE_ADDRESS = '0x8ab0cf264df99d83525e9e11c7e4db01558ae1b1'

const navigationItems = [
  { label: 'Product', href: '/', exact: true },
  { label: 'Premium', href: '/premium' },
  { label: 'Documentation', href: 'https://soci4l.net/docs', external: true },
  { label: 'Live Demo', href: '/demo', badge: 'NEW' },
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
export function AppHeader({ showSidebarTrigger = false, sticky = true, showNavigation = false, className }: AppHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

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
        sticky && 'sticky top-0 z-[100]',
        'backdrop-blur supports-[backdrop-filter]:bg-background/60 transition-all ease-linear shadow-sm',
        className
      )}
    >
      {/* Left: Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href="/"
          className="flex items-center gap-2 hover:opacity-80 transition-opacity group"
        >
          <Soci4LLogo variant="combination" className="h-5 w-auto transition-transform group-hover:scale-105" />
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
                    rel="noopener"
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
                  'text-sm font-medium transition-colors relative',
                  'hover:bg-accent hover:text-accent-foreground',
                  'h-9 px-4',
                  active && 'bg-accent text-accent-foreground'
                )}
              >
                {item.label}
                {item.badge && (
                  <Badge
                    variant="secondary"
                    className="ml-2 px-1 py-0 h-4 text-[9px] font-bold bg-brand text-white border-brand/20 shadow-sm"
                  >
                    {item.badge}
                  </Badge>
                )}
              </Button>
            )
          })}
        </nav>
      )}

      {/* Right: Header Actions (Connect Wallet / Avatar Dropdown) */}
      <div className="flex flex-1 items-center justify-end gap-3 shrink-0">
        <HeaderActions />

        {/* Mobile Navigation Menu */}
        {showNavigation && (
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle mobile menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[340px] pt-12">
              <SheetHeader className="mb-6 text-left">
                <SheetTitle className="text-lg font-bold">Navigation</SheetTitle>
              </SheetHeader>
              <nav className="flex flex-col gap-2">
                {navigationItems.map((item) => {
                  const active = !item.external && isActive(item.href, item.exact)

                  if (item.external) {
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        asChild
                        className={cn(
                          'justify-start text-sm font-medium transition-colors w-full',
                          'h-11 px-4'
                        )}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <a href={item.href} target="_blank" rel="noopener">
                          {item.label}
                        </a>
                      </Button>
                    )
                  }

                  return (
                    <Button
                      key={item.href}
                      variant={active ? "secondary" : "ghost"}
                      onClick={() => {
                        setMobileMenuOpen(false)
                        router.push(item.href)
                      }}
                      className={cn(
                        'justify-start text-sm font-medium transition-colors w-full relative',
                        'h-11 px-4'
                      )}
                    >
                      {item.label}
                      {item.badge && (
                        <Badge
                          variant="secondary"
                          className="ml-auto px-1.5 py-0 h-5 text-[10px] font-bold bg-brand text-white border-brand/20 shadow-sm"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Button>
                  )
                })}
              </nav>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </header>
  )
}
