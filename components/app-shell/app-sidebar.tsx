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
import { LayoutDashboard, Wallet, Activity, Settings, Users, Wand2, Link2, BarChart3 } from 'lucide-react'
import { sanitizeQueryParams } from '@/lib/query-params'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'

const platformItems = [
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
]

const profileItems = [
  {
    title: 'Builder',
    icon: Wand2,
    value: 'builder',
  },
  {
    title: 'Links',
    icon: Link2,
    value: 'links',
  },
  {
    title: 'Insights',
    icon: BarChart3,
    value: 'insights',
  },
  {
    title: 'Settings',
    icon: Settings,
    value: 'settings',
  },
]

const navGroups = [
  {
    label: 'Platform',
    items: platformItems,
  },
  {
    label: 'Profile',
    items: profileItems,
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
    
    // If we're on a link detail page (/dashboard/[address]/links/[linkId]),
    // navigate to the main dashboard page instead of adding tab param to current path
    const isLinkDetailPage = pathname.includes('/links/') && pathname.split('/').length > 4
    
    if (isLinkDetailPage) {
      // Extract address from pathname: /dashboard/[address]/links/[linkId]
      const pathParts = pathname.split('/')
      const addressIndex = pathParts.indexOf('dashboard') + 1
      if (addressIndex > 0 && pathParts[addressIndex]) {
        const address = pathParts[addressIndex]
        router.replace(`/dashboard/${address}?${sanitized.toString()}`, { scroll: false })
      } else {
        // Fallback: use current pathname (shouldn't happen)
        router.replace(`${pathname}?${sanitized.toString()}`, { scroll: false })
      }
    } else {
      router.replace(`${pathname}?${sanitized.toString()}`, { scroll: false })
    }
    
    // Close sidebar on mobile after selection
    if (isMobile) {
      setOpenMobile(false)
    }
  }

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div className={`flex items-center justify-center w-full ${isCollapsed ? 'px-0' : 'px-2'}`}>
          {isCollapsed ? (
            <Soci4LLogo variant="icon" width={18} height={19} />
          ) : (
            <Soci4LLogo variant="combination" width={100} height={19} />
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((group, index) => {
          const spacingClass = index === 0 ? 'mt-2 mb-1' : 'mt-6 mb-1'

          return (
            <SidebarGroup key={group.label}>
              <SidebarGroupLabel
                className={`${spacingClass} text-xs uppercase tracking-widest text-muted-foreground/60 ${
                  isCollapsed ? 'opacity-0 pointer-events-none' : ''
                }`}
              >
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
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
                          {!isCollapsed && <span>{item.title}</span>}
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    )
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )
        })}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
