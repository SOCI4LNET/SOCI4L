'use client'

import * as React from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { LayoutDashboard, Wallet, Activity, Settings, Users } from 'lucide-react'
import { sanitizeQueryParams } from '@/lib/query-params'

interface AppSidebarProps {
  address?: string
}

const menuItems = [
  {
    title: 'Overview',
    icon: LayoutDashboard,
    value: 'overview',
  },
  {
    title: 'Assets',
    icon: Wallet,
    value: 'assets',
  },
  {
    title: 'Activity',
    icon: Activity,
    value: 'activity',
  },
  {
    title: 'Social',
    icon: Users,
    value: 'social',
  },
  {
    title: 'Settings',
    icon: Settings,
    value: 'settings',
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setOpenMobile, isMobile, state } = useSidebar()
  const currentTab = searchParams.get('tab') || 'overview'
  const isCollapsed = state === 'collapsed'

  const handleTabChange = (value: string) => {
    // Sanitize query params: remove params not allowed for the target tab
    // This prevents cross-tab parameter pollution (e.g., subtab=following on Settings)
    const sanitized = sanitizeQueryParams(searchParams, value)
    sanitized.set('tab', value)
    
    router.replace(`${pathname}?${sanitized.toString()}`, { scroll: false })
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className={`flex items-center gap-2 px-2 ${isCollapsed ? 'justify-center px-0 gap-0' : ''}`}>
          <div className="h-6 w-6 rounded-full bg-white flex-shrink-0" />
          {!isCollapsed && (
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <span className="text-sm font-semibold leading-none text-sidebar-foreground truncate">SOCI4L</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? 'opacity-0 pointer-events-none' : ''}>Platform</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const Icon = item.icon
                const isActive = currentTab === item.value
                
                return (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => handleTabChange(item.value)}
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Icon />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
