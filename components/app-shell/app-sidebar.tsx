'use client'

import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '@/components/ui/sidebar'
import { LayoutDashboard, Wallet, Activity, Settings, Users } from 'lucide-react'
import { formatAddress } from '@/lib/utils'

interface AppSidebarProps {
  address: string
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

export function AppSidebar({ address }: AppSidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const currentTab = searchParams.get('tab') || 'overview'

  const handleTabChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('tab', value)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex flex-col space-y-1 flex-1">
            <h2 className="text-lg font-semibold">Dashboard</h2>
            <p className="text-xs text-muted-foreground font-mono">
              {formatAddress(address)}
            </p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
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
