'use client'

import * as React from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
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
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { LayoutDashboard, Wallet, Activity, Settings, Users, Wand2, Link2, BarChart3, ChevronDown, User } from 'lucide-react'
import { sanitizeQueryParams } from '@/lib/query-params'
import { Soci4LLogo } from '@/components/logos/soci4l-logo'
import { cn } from '@/lib/utils'

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

  // Check if current route is a profile route
  // 1. Check query param tab (builder, links, insights, settings)
  // 2. Check pathname for /dashboard/[address] with profile routes
  const isProfileTabFromQuery = profileItems.some(item => item.value === currentTab)
  const isProfileRouteFromPath = pathname.includes('/dashboard/') && 
    (pathname.includes('/builder') || 
     pathname.includes('/links') || 
     pathname.includes('/insights') || 
     pathname.includes('/settings'))
  const isProfileRoute = isProfileTabFromQuery || isProfileRouteFromPath

  // Default state: Desktop = always open, Mobile = closed
  const getDefaultOpenState = () => {
    if (isMobile) {
      return false // Mobile: default closed
    }
    return true // Desktop: always open by default
  }

  // Profile collapsible state
  const [isProfileOpen, setIsProfileOpen] = React.useState(getDefaultOpenState)

  // Auto-expand when navigating to a profile route (for mobile or when manually closed)
  React.useEffect(() => {
    if (isProfileRoute && !isMobile) {
      setIsProfileOpen(true)
    }
  }, [isProfileRoute, isMobile])

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
        <Link href="/" className={`flex items-center justify-center w-full ${isCollapsed ? 'px-0' : 'px-2'} hover:opacity-80 transition-opacity`}>
          {isCollapsed ? (
            <Soci4LLogo variant="icon" width={18} height={19} />
          ) : (
            <Soci4LLogo variant="combination" width={100} height={19} />
          )}
        </Link>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* Platform Items */}
              {platformItems.map((item) => {
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

              {/* Profile Collapsible */}
              <Collapsible
                open={isCollapsed ? false : isProfileOpen}
                onOpenChange={isCollapsed ? undefined : setIsProfileOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={isCollapsed ? navGroups[1].label : undefined}>
                      <User className="h-4 w-4" />
                      {!isCollapsed && (
                        <>
                          <span>{navGroups[1].label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {profileItems.map((item) => {
                        const Icon = item.icon
                        const isActive = currentTab === item.value

                        return (
                          <SidebarMenuSubItem key={item.value}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                            >
                              <button
                                type="button"
                                onClick={() => handleTabChange(item.value)}
                                className="w-full"
                              >
                                <Icon />
                                <span>{item.title}</span>
                              </button>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        )
                      })}
                    </SidebarMenuSub>
                  </CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
