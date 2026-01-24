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
}

/**
 * ShellHeaderRow - Full-width header/breadcrumb row that uses shared gutter spacing.
 * This ensures perfect alignment with page content containers.
 */
export function AppTopbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'
  
  // Check if we're on a link detail page
  const isLinkDetailPage = pathname.includes('/links/') && pathname.split('/').length > 4
  
  // Use appropriate label based on page type
  const tabLabel = isLinkDetailPage ? 'Link Insights' : (tabLabels[currentTab] || 'Overview')

  return (
    <header className={`sticky top-0 z-50 flex h-14 min-h-[3.5rem] items-center gap-2 border-b border-border bg-background/80 ${PAGE_GUTTER} backdrop-blur transition-[width] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 group-has-data-[collapsible=icon]/sidebar-wrapper:min-h-[3rem]`}>
      <div className="flex items-center gap-2 shrink-0">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4 shrink-0"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem className="hidden md:block">
              {isLinkDetailPage ? (
                <BreadcrumbLink asChild>
                  <Link href={`${pathname.split('/').slice(0, 3).join('/')}?tab=overview`}>
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbLink asChild>
                  <Link href={`${pathname.split('?')[0]}?tab=overview`}>
                    Dashboard
                  </Link>
                </BreadcrumbLink>
              )}
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
