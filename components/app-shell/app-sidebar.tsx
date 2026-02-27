'use client'

import * as React from 'react'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { sanitizeQueryParams } from '@/lib/query-params'

import { LayoutDashboard, Wallet, Activity, Settings, Users, Wand2, Link2, BarChart3, ChevronDown, User, Shield, CreditCard, Layers } from 'lucide-react'

import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton, SidebarRail, useSidebar } from '@/components/ui/sidebar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
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
    title: 'NFTs',
    icon: Layers,
    value: 'nfts',
  },
  {
    title: 'Social',
    icon: Users,
    value: 'social',
  },
]

const studioItems = [
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
]

const accountItems = [
  {
    title: 'Safety',
    icon: Shield,
    value: 'safety',
  },
  {
    title: 'Settings',
    icon: Settings,
    value: 'settings',
  },
  {
    title: 'Billing',
    icon: CreditCard,
    value: 'billing',
  },
]

const navGroups = [
  {
    label: 'Dashboard',
    items: platformItems,
  },
  {
    label: 'Studio',
    items: studioItems,
  },
  {
    label: 'Account',
    items: accountItems,
  },
]

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { setOpenMobile, isMobile, state } = useSidebar()

  // Determine current tab from query param OR pathname
  let currentTab = searchParams.get('tab')
  if (!currentTab) {
    currentTab = 'overview'
  }

  const isCollapsed = state === 'collapsed'

  // Determine which sections should be open based on the current tab
  const isStudioTab = studioItems.some((item: any) => item.value === currentTab)
  const isAccountTab = accountItems.some((item: any) => item.value === currentTab)

  // Default state: Desktop = open if active, Mobile = closed
  const getDefaultOpenState = (isOpen: boolean) => {
    if (isMobile) return false
    return isOpen
  }

  // Section open states
  const [isStudioOpen, setIsStudioOpen] = React.useState(() => getDefaultOpenState(isStudioTab))
  const [isAccountOpen, setIsAccountOpen] = React.useState(() => getDefaultOpenState(isAccountTab))

  // Auto-expand when navigating
  React.useEffect(() => {
    if (!isMobile) {
      if (isStudioTab) setIsStudioOpen(true)
      if (isAccountTab) setIsAccountOpen(true)
    }
  }, [isStudioTab, isAccountTab, isMobile])

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
    <Sidebar collapsible="icon" className="h-svh sticky top-0" {...props}>
      <SidebarHeader>
        <Link href="/" className={`flex items-center justify-center w-full h-10 ${isCollapsed ? 'px-0' : 'px-2'} hover:opacity-80 transition-opacity`}>
          {isCollapsed ? (
            <Soci4LLogo variant="icon" width={20} height={20} />
          ) : (
            <Soci4LLogo variant="combination" width={97} height={20} />
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
                      className="gap-3"
                    >
                      <Icon className="text-[#27272a] dark:text-[#f0f0f0]" strokeWidth={1} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}

              {/* Studio Collapsible */}
              <Collapsible
                open={isCollapsed ? false : isStudioOpen}
                onOpenChange={isCollapsed ? undefined : setIsStudioOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={isCollapsed ? navGroups[1].label : undefined} className="gap-3">
                      <User className="h-4 w-4 text-[#27272a] dark:text-[#f0f0f0]" strokeWidth={1} />
                      {!isCollapsed && (
                        <>
                          <span>{navGroups[1].label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" strokeWidth={1} />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {studioItems.map((item: any) => {
                        const Icon = item.icon
                        const isActive = currentTab === item.value

                        return (
                          <SidebarMenuSubItem key={item.value}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              className="gap-3 [&>svg]:!text-[#27272a] dark:[&>svg]:!text-[#f0f0f0]"
                            >
                              <button
                                type="button"
                                onClick={() => handleTabChange(item.value)}
                                className="w-full"
                              >
                                <Icon className="text-[#27272a] dark:text-[#f0f0f0]" strokeWidth={1} />
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

              {/* Account Collapsible */}
              <Collapsible
                open={isCollapsed ? false : isAccountOpen}
                onOpenChange={isCollapsed ? undefined : setIsAccountOpen}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={isCollapsed ? navGroups[2].label : undefined} className="gap-3">
                      <Settings className="h-4 w-4 text-[#27272a] dark:text-[#f0f0f0]" strokeWidth={1} />
                      {!isCollapsed && (
                        <>
                          <span>{navGroups[2].label}</span>
                          <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-180" strokeWidth={1} />
                        </>
                      )}
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <SidebarMenuSub>
                      {accountItems.map((item: any) => {
                        const Icon = item.icon
                        const isActive = currentTab === item.value

                        return (
                          <SidebarMenuSubItem key={item.value}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={isActive}
                              className="gap-3 [&>svg]:!text-[#27272a] dark:[&>svg]:!text-[#f0f0f0]"
                            >
                              <button
                                type="button"
                                onClick={() => handleTabChange(item.value)}
                                className="w-full"
                              >
                                <Icon className="text-[#27272a] dark:text-[#f0f0f0]" />
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
