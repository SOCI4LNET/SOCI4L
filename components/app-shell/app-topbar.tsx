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

const tabLabels: Record<string, string> = {
  overview: 'Overview',
  assets: 'Assets',
  activity: 'Activity',
  social: 'Social',
  settings: 'Settings',
}

export function AppTopbar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const currentTab = searchParams.get('tab') || 'overview'
  const tabLabel = tabLabels[currentTab] || 'Overview'

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="mr-2 h-4"
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
      <div className="flex flex-1 items-center justify-end gap-2">
        <HeaderActions />
      </div>
    </header>
  )
}
