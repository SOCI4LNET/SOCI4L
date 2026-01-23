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

const tabLabels: Record<string, string> = {
  overview: 'Overview',
  assets: 'Assets',
  activity: 'Activity',
  social: 'Social',
  settings: 'Settings',
}

/**
 * ShellHeaderRow - Full-width header/breadcrumb row that uses shared gutter spacing.
 * This ensures perfect alignment with page content containers.
 */
export function AppTopbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'
  const tabLabel = tabLabels[currentTab] || 'Overview'

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
              <BreadcrumbLink href="#">
                Dashboard
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator className="hidden md:block" />
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
