'use client'

import { SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { HeaderActions } from './header-actions'
import { usePathname, useSearchParams } from 'next/navigation'
import { PAGE_GUTTER } from '@/lib/layout-constants'
import Link from 'next/link'

const tabLabels: Record<string, string> = {
  overview: 'Overview',
  assets: 'Assets',
  activity: 'Activity',
  social: 'Social',
  settings: 'Settings',
  builder: 'Builder',
  links: 'Links',
  insights: 'Insights',
  safety: 'Safety',
}

/**
 * ShellHeaderRow - Full-width header/breadcrumb row that uses shared gutter spacing.
 * This ensures perfect alignment with page content containers.
 */
export function AppTopbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  // Determine current tab from query param OR pathname
  let currentTab = searchParams.get('tab')
  if (!currentTab) {
    currentTab = 'overview'
  }

  // Check if we're on a link detail page
  const isLinkDetailPage = pathname.includes('/links/') && pathname.split('/').length > 4

  // Use appropriate label based on page type
  const tabLabel = isLinkDetailPage ? 'Link Insights' : (tabLabels[currentTab] || 'Overview')

  return (
    <header className={`sticky top-0 z-50 flex h-14 min-h-[3.5rem] items-center gap-2 border-b border-border bg-background/80 ${PAGE_GUTTER} backdrop-blur transition-[width] ease-linear`}>
      <div className="flex items-center shrink-0 pl-1">
        <SidebarTrigger className="-ml-1 mr-3" />
        <Separator
          orientation="vertical"
          className="mr-3 h-4 shrink-0"
        />
        <Breadcrumb>
          <BreadcrumbList className="gap-[10px] sm:gap-[10px]">
            <BreadcrumbItem className="hidden md:block">
              {(() => {
                const dashboardTabs = ['overview', 'assets', 'activity', 'social']
                const studioTabs = ['builder', 'links', 'insights']
                const accountTabs = ['settings', 'safety']

                let rootLabel = 'Dashboard'
                let rootTab = 'overview'

                if (studioTabs.includes(currentTab)) {
                  rootLabel = 'Studio'
                  rootTab = 'builder'
                } else if (accountTabs.includes(currentTab)) {
                  rootLabel = 'Account'
                  rootTab = 'settings'
                }

                // Base path depends on if we are in a sub-route (e.g. /links/xyz) or main page
                const basePath = isLinkDetailPage
                  ? pathname.split('/').slice(0, 3).join('/')
                  : pathname.split('?')[0]

                return (
                  <BreadcrumbLink asChild>
                    <Link href={`${basePath}?tab=${rootTab}`}>
                      {rootLabel}
                    </Link>
                  </BreadcrumbLink>
                )
              })()}
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
            {isLinkDetailPage && (
              <>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink asChild>
                    <Link href={`${pathname.split('/').slice(0, 3).join('/')}?tab=links`}>
                      Links
                    </Link>
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
              </>
            )}
            <BreadcrumbItem>
              <BreadcrumbPage>{tabLabel}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex flex-1 items-center justify-end gap-2 shrink-0">
        <HeaderActions />
      </div>
    </header>
  )
}
